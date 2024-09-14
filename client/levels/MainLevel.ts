import { DoubleSide, Mesh, MeshPhysicalMaterial, PlaneGeometry, Scene } from "three";
import Level from "./interfaces/Level";
import { addPhysics, PhysicsObject } from "../render/physics/physics";
import { getGroundMesh } from "../helpers/meshes";
import EnvLight from "./lights/EvnLight";
import LevelActor from "./interfaces/LevelActor";

// * Level Settings
const groundWidth = 100;
const groundHeight = 100;

class MainLevel implements Level {
  scene: Scene;
  ground: Mesh;
  groundPhysicsObject: PhysicsObject;
  actorCount: number;
  meshCount: number;
  actors: Map<number, LevelActor>;
  meshes: Map<number, Mesh>;

  constructor(scene: Scene) {
    this.scene = scene;
    this.actorCount = 0;
    this.meshCount = 0;
    this.actors = new Map<number, LevelActor>();
    this.meshes = new Map<number, Mesh>();
    this.ground = getGroundMesh();
    // this.ground.rotation.x -= Math.PI / 2;
    this.groundPhysicsObject = addPhysics(this.ground, 'fixed', false, undefined, 'cuboid', {
      width: groundWidth / 2,
      height: 0.001,
      depth: groundHeight / 2,
    }); 
  }

  addActor(actor: LevelActor) {
    this.actors.set(this.actorCount, actor);
    this.actorCount += 1;
  }

  init = () => {
    // push lights in actors Map
    const baseLights = new EnvLight(this.scene);
    this.addActor(baseLights);

    
    // Load level objects and add them to scene
    this.scene.add(this.ground);
    return this;
  }

  playLevel = () => {
    // start game loop here. call init function of level actors
    this.actors.forEach((actor) => actor.init())


    // tick.start();
  }
}

export default MainLevel;
