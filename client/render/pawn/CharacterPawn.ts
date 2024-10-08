import { Vector3, Mesh } from "three";
import { addPhysics, PhysicsObject } from '../physics/physics';
import { _addCapsule, _removeCapsule } from '../../helpers/meshes';
import { _calculateObjectSize } from '../../helpers/objects';

class CharacterPawn extends Mesh {
  position:Vector3;
  capsule: Mesh;
  // physics
  physicsObject: PhysicsObject;
  width: number;
  height: number;

  constructor() {
    super();
    this.position = new Vector3();
    this.capsule = _addCapsule(1.5, 0.5, 10, 10);
    const size = _calculateObjectSize(this.capsule);
    this.width = size.x
    this.height = size.y

    // physics
    this.physicsObject = this.initPhysics();
  }

  updateCapsule() {
    this.capsule.position.copy(this.position);

    this.physicsObject.rigidBody.setNextKinematicTranslation(this.position.clone());
  }

  initPhysics() {
    // physics object
    const radius = this.width / 2;
    const halfHeight = this.height / 2 - radius;
    const physicsObject = addPhysics(this, 'kinematicPositionBased', false, undefined, 'capsule', {
      halfHeight,
      radius,
    });

    return physicsObject;
  }

  setPosition(position: Vector3) {
    this.position.copy(position);
    // copy position state to capsule mesh
    this.updateCapsule();
  }

  delete() {
    _removeCapsule(this.capsule);
    this.physicsObject.remove();
  }
}

export default CharacterPawn;
