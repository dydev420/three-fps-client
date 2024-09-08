import * as THREE from 'three';
import { _calculateObjectSize } from './utils/objects';
import CharacterController from './CharacterController';
import SimpleCharacterController from './SimpleCharacterController';

// Responsible for controlling the avatar mesh and the character controller
class AvatarController {
  avatar: THREE.Mesh
  // characterController: CharacterController
  characterController: SimpleCharacterController
  height: number
  width: number

  constructor(avatar: THREE.Mesh, camera: THREE.PerspectiveCamera) {
    this.avatar = avatar

    const size = _calculateObjectSize(avatar)
    this.width = size.x
    this.height = size.y
    // this.characterController = new CharacterController(this, camera)
    this.characterController = new SimpleCharacterController(this, camera)
  }

  update(timestamp: number, deltaTime: number) {
    this.characterController.update(timestamp, deltaTime)
    this.avatar.position.copy(this.characterController.position)
  }
}

export default AvatarController