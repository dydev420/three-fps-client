import { Vector3 } from 'three';
import { _calculateObjectSize } from '../helpers/objects'
import { updateEnginePlayer } from '../../common/index.mts';
import type { Player} from '../../common/types';
import CharacterPawn from '../render/pawn/CharacterPawn';
import Character from './interfaces/Character';

// * Responsible for controlling the character movement, rotation and physics
class OnlinePlayer implements Character {
  isMoving2D: boolean;
  pawn: CharacterPawn;
  position: Vector3;
  
  // mp states
  id: number;
  player: Player | undefined;

  constructor(player: Player) {
    // init position
    this.position = new Vector3();
    
    // Multiplayer states
    this.id = player.id;
    this.player = player;
    

    // Mesh and Physics
    this.pawn = new CharacterPawn();

    this.isMoving2D = false
  }

  update(deltaTime: number) {
    if(this.player) {      
      updateEnginePlayer(this.player, deltaTime);
      this.position.x = this.player.position.x;
      this.position.z = this.player.position.y;

      this.pawn.setPosition(this.position);
    }
  }

  delete() {
    this.pawn.delete();
  }
}

export default OnlinePlayer;
