import * as THREE from "three";
import { PhysicsObject } from "../../physics/physics";

interface Pawn {
  position: THREE.Vector3;
  capsule: THREE.Mesh;
  // physics
  physicsObject: PhysicsObject;
  width: number;
  height: number;
}

export default Pawn;