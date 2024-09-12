import { Quaternion, Vector3 } from 'three'
import {
  useComposer,
  useControls,
  useDebugManager,
  useGame,
  usePawnManager,
  usePhysics,
  usePhysicsObjects,
  useRenderer,
  useStats,
} from './init'
import { addInputListeners } from '../gameInput'

// animation params
type Frame = XRFrame | null

export type TickData = {
  timestamp: number
  deltaTime: number
  fps: number
  frame: Frame
}

const localTickData: TickData = {
  timestamp: 0,
  deltaTime: 0,
  fps: 0,
  frame: null,
}

const localFrameOpts = {
  data: localTickData,
}

const frameEvent = new MessageEvent('tick', localFrameOpts)

class TickManager extends EventTarget {
  timestamp: number
  deltaTime: number
  frame: Frame
  lastTimestamp: number
  fps: number

  constructor({ timestamp, deltaTime, frame } = localTickData) {
    super()

    this.timestamp = timestamp
    this.deltaTime = deltaTime
    this.frame = frame
    this.lastTimestamp = 0
    this.fps = 0
  }

  startLoop() {
    const composer = useComposer()
    const renderer = useRenderer()
    // const scene = useScene()
    // const camera = useCamera()
    const physics = usePhysics()
    const physicsObjects = usePhysicsObjects()
    const controls = useControls()
    const stats = useStats()
    const game = useGame()
    const pawnManager = usePawnManager();
    const debugManager = useDebugManager();

    if (!renderer) {
      throw new Error('Updating Frame Failed : Uninitialized Renderer')
    }

    const animate = (timestamp: number, frame: Frame) => {
      const now = performance.now()
      this.timestamp = timestamp ?? now
      this.deltaTime = timestamp - this.lastTimestamp

      const deltaTimeCapped = Math.min(Math.max(this.deltaTime, 0), 100)

      // physics
      physics.step()

      for (let i = 0; i < physicsObjects.length; i++) {
        const po = physicsObjects[i]
        const autoAnimate = po.autoAnimate

        if (autoAnimate) {
          const mesh = po.mesh
          const collider = po.collider
          mesh.position.copy(collider.translation() as Vector3)
          mesh.quaternion.copy(collider.rotation() as Quaternion)
        }

        const fn = po.fn
        fn && fn()
      }

      // performance tracker start
      this.fps = 1000 / this.deltaTime
      this.lastTimestamp = this.timestamp

      // controls.update(timestamp / 1000, deltaTimeCapped / 1000);

      // Sync multiplayer objects
      pawnManager.update(deltaTimeCapped / 1000);

      // Debug player boxes
      debugManager.update(deltaTimeCapped / 1000);

      composer.render()
      // renderer.render(scene, camera);

      this.tick(timestamp, deltaTimeCapped, this.fps, frame)

      stats.update()
    }

    addInputListeners(game);

    renderer.setAnimationLoop(animate)
  }

  tick(timestamp: number, deltaTime: number, fps: number, frame: Frame) {
    localTickData.timestamp = timestamp
    localTickData.frame = frame
    localTickData.deltaTime = deltaTime
    localTickData.fps = fps
    this.dispatchEvent(frameEvent)
  }
}

export default TickManager;
