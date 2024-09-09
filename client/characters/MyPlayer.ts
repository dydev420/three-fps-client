import * as THREE from 'three';
import { _calculateObjectSize } from '../render/controllers/utils/objects'
import * as common from '../../server/common.mts';
import type { Player} from '../../server/common.mts';
import CharacterPawn from '../render/pawn/CharacterPawn';
import Character from './interfaces/Character';

// * Responsible for controlling the character movement, rotation and physics
class MyPlayer implements Character {
  camera: THREE.PerspectiveCamera | undefined;
  // inputManager: InputManager;
  phi: number;
  theta: number;
  objects: any;
  isMoving2D: boolean;
  pawn: CharacterPawn;
  position: THREE.Vector3;
  
  // mp states
  id: number;
  player: Player | undefined;

  constructor(player: Player, camera?: THREE.PerspectiveCamera) {
    // init position
    this.position = new THREE.Vector3();
    
    // Multiplayer states
    this.id = player.id;
    this.player = player;

    this.camera = camera;
  
    // Mesh and Physics
    this.pawn = new CharacterPawn();

    // Camera Params
    this.phi = 0
    this.theta = 0

    this.isMoving2D = false
  }

  update(deltaTime: number) {
    this.updatePosition(deltaTime);
    
    // this.updateRotation()
    // this.updateTranslation(deltaTime)
    if(this.camera) {
      this.updateCamera();
    }
  }

  updateCamera() {
    if(!this.camera || !this.player) {
      return;
    }
    const forwardDir = common.getForwardDir(this.player);
    const forwardVector = new THREE.Vector3(forwardDir.x, 0, forwardDir.y);
    
    this.camera.position.copy(this.position);
    const cameraTarget = this.camera.position.clone();
    cameraTarget.add(forwardVector);
    this.camera.lookAt(cameraTarget);
  }

  updatePosition(deltaTime: number) {    
    if(this.player) {      
      common.updatePlayer(this.player, deltaTime);
      this.position.x = this.player.position.x;
      this.position.z = this.player.position.y;

      this.pawn.setPosition(this.position);
    }
  }
}

export default MyPlayer;
