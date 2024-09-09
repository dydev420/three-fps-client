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

/**
 * Input Handlers
 */
export function addInputListeners(game: Game) {
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
}
