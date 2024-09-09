import * as THREE from 'three';
import { _calculateObjectSize } from '../render/controllers/utils/objects'
import * as common from '../../server/common.mts';
import type { Player} from '../../server/common.mts';
import CharacterPawn from '../render/pawn/CharacterPawn';
import Character from './interfaces/Character';

// * Responsible for controlling the character movement, rotation and physics
class OnlinePlayer implements Character {
  isMoving2D: boolean;
  pawn: CharacterPawn;
  position: THREE.Vector3;
  
  // mp states
  id: number;
  player: Player | undefined;

  constructor(player: Player) {
    // init position
    this.position = new THREE.Vector3();
    
    // Multiplayer states
    this.id = player.id;
    this.player = player;
    

    // Mesh and Physics
    this.pawn = new CharacterPawn();

    this.isMoving2D = false
  }

  update(deltaTime: number) {
    if(this.player) {      
      common.updatePlayer(this.player, deltaTime);
      this.position.x = this.player.position.x;
      this.position.z = this.player.position.y;

      this.pawn.setPosition(this.position);
    }
  }
}

export default OnlinePlayer;
