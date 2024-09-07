import { useRenderer } from './../init'
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, SCROLL_LEVEL_STEP } from './utils/constants'


// * supported keyboard keys
export enum KEYS {
  a = 'KeyA',
  s = 'KeyS',
  w = 'KeyW',
  d = 'KeyD',
  space = 'Space',
  shiftL = 'ShiftLeft',
  shiftR = 'ShiftRight',
}

export type MouseState = {
  leftButton: boolean
  rightButton: boolean
  mouseXDelta: number
  mouseYDelta: number
  mouseWheelDelta: number
}

// * Responsible for the inputs of the user
class InputManager {
  target: Document
  currentMouse: MouseState
  currentKeys: Map<string, boolean> 
  pointerLocked: boolean

  constructor(target?: Document) {
    this.target = target || document
    this.currentMouse = {
      leftButton: false,
      rightButton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseWheelDelta: 0,
    }
    this.currentKeys = new Map<string, boolean>()
    this.pointerLocked = false

    this.init()
  }

  init() {
    // mouse event handlers
    this.target.addEventListener('mousedown', (e) => this.onMouseDown(e), false)
    this.target.addEventListener('mousemove', (e) => this.onMouseMove(e), false)
    this.target.addEventListener('mouseup', (e) => this.onMouseUp(e), false)
    // mouse wheel
    addEventListener('wheel', (e) => this.onMouseWheel(e), false)

    // keyboard event handlers
    this.target.addEventListener('keydown', (e) => this.onKeyDown(e), false)
    this.target.addEventListener('keyup', (e) => this.onKeyUp(e), false)

    const renderer = useRenderer()

    // handling pointer lock
    const addPointerLockEvent = async () => {
      await renderer.domElement.requestPointerLock()
    }
    renderer.domElement.addEventListener('click', addPointerLockEvent)
    renderer.domElement.addEventListener('dblclick', addPointerLockEvent)
    renderer.domElement.addEventListener('mousedown', addPointerLockEvent)

    const setPointerLocked = () => {
      this.pointerLocked = document.pointerLockElement === renderer.domElement
    }
    document.addEventListener('pointerlockchange', setPointerLocked, false)
  }

  onMouseWheel(e: WheelEvent) {
    const changeMouseWheelLevel = () => {
      if (this.pointerLocked) {
        if (e.deltaY < 0) {
          // * scrolling up, zooming in
          this.currentMouse.mouseWheelDelta = Math.max(
            this.currentMouse.mouseWheelDelta - SCROLL_LEVEL_STEP,
            MIN_ZOOM_LEVEL
          )
        } else if (e.deltaY > 0) {
          // * scrolling down, zooming out
          this.currentMouse.mouseWheelDelta = Math.min(
            this.currentMouse.mouseWheelDelta + SCROLL_LEVEL_STEP,
            MAX_ZOOM_LEVEL
          )
        }
      }
    }

    changeMouseWheelLevel()
  }

  onMouseMove(e: MouseEvent) {
    if (this.pointerLocked) {
      this.currentMouse.mouseXDelta = e.movementX;
      this.currentMouse.mouseYDelta = e.movementY;
    }
  }

  onMouseDown(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)

      // * right click, left click
      switch (e.button) {
        case 0: {
          this.currentMouse.leftButton = true
          break
        }
        case 2: {
          this.currentMouse.rightButton = true
          break
        }
      }
    }
  }

  onMouseUp(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)

      // * right click, left click
      switch (e.button) {
        case 0: {
          this.currentMouse.leftButton = false
          break
        }
        case 2: {
          this.currentMouse.rightButton = false
          break
        }
      }
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, true)
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, false)
    }
  }

  isKeyDown(keyCode: string | number) {
    if (this.pointerLocked) {
      const hasKeyCode = this.currentKeys.get(keyCode as string)
      if (hasKeyCode) {
        return hasKeyCode
      }
    }

    return false
  }

  update() {
    this.currentMouse.mouseXDelta = 0
    this.currentMouse.mouseYDelta = 0
  }

  runActionByKey(key: string, action: Function, inAction?: Function) {
    // * run function if the key is pressed
    if (this.isKeyDown(key)) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  runActionByOneKey(keys: Array<string>, action: Function, inAction?: Function) {
    // * run the function if one of the keys in the 'keys' array is pressed
    let check = false
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (check) {
        break
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  runActionByAllKeys(keys: Array<string>, action: Function, inAction?: Function) {
    // * if all of the keys in the 'keys' array are pressed at the same time, run the function
    let check = true
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (!check) {
        break
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }
}

export default InputManager;
