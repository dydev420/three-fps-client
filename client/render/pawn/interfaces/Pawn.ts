import { Vector3, Mesh } from "three";
import { PhysicsObject } from "../../physics/physics";

interface Pawn {
  position: Vector3;
  capsule: Mesh;
  // physics
  physicsObject: PhysicsObject;
  width: number;
  height: number;
}

export default Pawn;