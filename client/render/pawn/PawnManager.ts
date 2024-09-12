import { PerspectiveCamera } from 'three';
import Character from "../../characters/interfaces/Character";
import MyPlayer from "../../characters/MyPlayer";
import OnlinePlayer from "../../characters/OnlinePlayer";
import type { Game } from "../../game";
import { Player } from '../../../common/types';

class PawnManager {
  game: Game;
  camera: PerspectiveCamera;
  pawns: Map<number, Character>;
  myPawn: MyPlayer | undefined;
  
  constructor(game: Game, camera: PerspectiveCamera) {
    this.game = game;
    this.camera = camera;
    this.pawns = new Map();
  }

  update(deltaTime: number) {
    
    // Sync multiplayer objects
    if(this.game.me && this.game.players) {
      this.game.players.forEach((player) => {
        if(player.id !== this.game.me?.id) {
          const pawn = this.pawns.get(player.id);
          this.updateOtherPawn(deltaTime, player, pawn);
        } else {
          this.updateMyPawn(deltaTime)
        }
      });

      // Remove disconnected pawns
      this.pawns.forEach((pawn, pawnId) => {
        if(!this.game.players.has(pawnId)) {
          pawn.delete();
          this.pawns.delete(pawnId);
        }
      });
    }
  }

  updateOtherPawn(deltaTime: number, player: Player, pawn: Character | undefined) {
    if(pawn) {
      pawn.update(deltaTime);              
    } else {
      this.pawns.set(player.id, new OnlinePlayer(player));
    }
  }

  updateMyPawn(deltaTime: number) {
    if(this.myPawn) {
      this.myPawn.update(deltaTime);
    } else if (this.game.me) {
      this.myPawn = new MyPlayer(this.game.me, this.camera);
    }

  }
}
export default PawnManager;