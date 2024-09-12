import { Vector2 } from "../server/lib/vector.mts";
import * as common from "../common/common.mts";
import { Player, Moving, MessageKind } from "../common/types";

// import { useGame } from "./render/init";
import type { Game } from "./game";
import PlayerMovingStruct from "../common/structs/PlayerMovingStruct";
import PlayerTurningStruct from "../common/structs/PlayerTurningStruct";

export const DIRECTION_KEYS: {[key: string]: Moving} = {
  ArrowLeft: Moving.TurningLeft,
  ArrowRight: Moving.TurningRight,
  ArrowUp: Moving.MovingForward,
  ArrowDown: Moving.MovingBackward,
  KeyA: Moving.TurningLeft,
  KeyD: Moving.TurningRight,
  KeyW: Moving.MovingForward,
  KeyS: Moving.MovingBackward,
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
        const view = new DataView(new ArrayBuffer(PlayerMovingStruct.size));
        PlayerMovingStruct.kind.write(view, MessageKind.PlayerMoving);
        PlayerMovingStruct.start.write(view, 1);
        PlayerMovingStruct.direction.write(view, direction);
        
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
        const view = new DataView(new ArrayBuffer(PlayerMovingStruct.size));
        PlayerMovingStruct.kind.write(view, MessageKind.PlayerMoving);
        PlayerMovingStruct.start.write(view, 0);
        PlayerMovingStruct.direction.write(view, direction);
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
    
    const view = new DataView(new ArrayBuffer(PlayerTurningStruct.size));
    PlayerTurningStruct.write(view, {
      kind: MessageKind.PlayerTurning,
      direction: game.me.direction,
    });
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
