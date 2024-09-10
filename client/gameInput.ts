import { Vector2 } from "../server/lib/vector.mts";
import * as common from "../server/common.mts";
import type { Player } from "../server/common.mts";

// import { useGame } from "./render/init";
import type { Game } from "./game";

export const DIRECTION_KEYS: {[key: string]: common.Moving} = {
  ArrowLeft: common.Moving.TurningLeft,
  ArrowRight: common.Moving.TurningRight,
  ArrowUp: common.Moving.MovingForward,
  ArrowDown: common.Moving.MovingBackward,
  KeyA: common.Moving.TurningLeft,
  KeyD: common.Moving.TurningRight,
  KeyW: common.Moving.MovingForward,
  KeyS: common.Moving.MovingBackward,
};

export let mouseState: { mouseXDelta: number, mouseYDelta: number } = {
  mouseXDelta: 0,
  mouseYDelta: 0,
};

let pointerLocked: boolean  = false; 


/**
 * Input Handlers
 */
export function addInputListeners(game: Game) {
  const canvas: HTMLCanvasElement = document.querySelector('body > canvas') as HTMLCanvasElement;

  window.addEventListener('keydown', (e) => {
    if(game.me === undefined || game.ws === undefined) {
      return;
    }
    if (!e.repeat) {
      const direction = DIRECTION_KEYS[e.code];
      if (direction !== undefined) {
        const view = new DataView(new ArrayBuffer(common.PlayerMovingStruct.size));
        common.PlayerMovingStruct.kind.write(view, common.MessageKind.PlayerMoving);
        common.PlayerMovingStruct.start.write(view, 1);
        common.PlayerMovingStruct.direction.write(view, direction);
        
        game.ws.send(view);
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    if(game.me === undefined || game.ws === undefined) {
      return;
    }
    if (!e.repeat) {
      
      const direction = DIRECTION_KEYS[e.code];
      if (direction !== undefined) {
        const view = new DataView(new ArrayBuffer(common.PlayerMovingStruct.size));
        common.PlayerMovingStruct.kind.write(view, common.MessageKind.PlayerMoving);
        common.PlayerMovingStruct.start.write(view, 0);
        common.PlayerMovingStruct.direction.write(view, direction);
        game.ws.send(view);
      }
    }
  });

  window.addEventListener('mousemove', (e: MouseEvent) => {
    if(!pointerLocked) {
      return;
    }

    const mouseXDelta = e.movementX;

    if(game.me === undefined || game.ws === undefined) {
      return;
    }

    // For rotation/camera action, use client authority.
    // update client rotation first before sending network data about rotation
    const dx = mouseXDelta/1000
    game.me.direction += dx;
    
    const view = new DataView(new ArrayBuffer(common.PlayerTurningStruct.size));
    common.PlayerTurningStruct.kind.write(view, common.MessageKind.PlayerTurning);
    common.PlayerTurningStruct.direction.write(view, game.me.direction);
    game.ws.send(view);
  });

  // Pointer lock on canvas
  canvas.addEventListener('click', async (e: MouseEvent) => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', async () => {
    if (document.pointerLockElement)
      pointerLocked = true;
    else 
      pointerLocked = false;
  });
}
