import { Mesh, PerspectiveCamera, Quaternion, Scene, Vector3, WebGLRenderer } from "three";
import Stats from 'three/examples/jsm/libs/stats.module.js'
import Level from "./interfaces/Level";
import { addPhysics, PhysicsObject } from "../render/physics/physics";
import { getGroundMesh } from "../helpers/meshes";
import EnvLight from "./lights/EvnLight";
import LevelActor from "./interfaces/LevelActor";
import Ticker from "../time/Ticker";
import RAPIER from "@dimforge/rapier3d";
import PhysicsDebugRenderer from "../render/physics/PhysicsDebugRenderer";
import { usePhysicsObjects, useStats } from "../render/init";

// * Level Settings
const groundWidth = 100;
const groundHeight = 100;

/**
 * Loads all env and game objects and starts the game loop after initializing all objects
 */
class MainLevel implements Level {
  /** Props */
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  physicsWorld: RAPIER.World;
  
  /** States */
  actorCount: number;
  meshCount: number;
  actors: Map<number, LevelActor>;
  meshes: Map<number, Mesh>;
  ticker: Ticker;
  physicsObjects: Array<PhysicsObject>;
  
  /** Models */
  ground: Mesh;
  groundPhysicsObject: PhysicsObject;

  /** Debugger */
  physicsDebugger: PhysicsDebugRenderer;
  stats: Stats;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, physicsWorld: RAPIER.World) {
    /** Props */
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.physicsWorld = physicsWorld;
    
    /** States */
    this.actorCount = 0;
    this.meshCount = 0;
    this.actors = new Map<number, LevelActor>();
    this.meshes = new Map<number, Mesh>();
    this.ticker = new Ticker();
    this.physicsObjects = usePhysicsObjects(); // TODO: do not use use*, use local level state

    /** Models */
    this.ground = getGroundMesh();
    // this.ground.rotation.x -= Math.PI / 2;
    this.groundPhysicsObject = addPhysics(this.ground, 'fixed', false, undefined, 'cuboid', {
      width: groundWidth / 2,
      height: 0.001,
      depth: groundHeight / 2,
    }); 

    /** Debugger */
    this.physicsDebugger = new PhysicsDebugRenderer(this.scene, this.physicsWorld);
    this.stats = useStats(); // TODO: use local stats maybe?
    
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

    // Load Debuggers
    this.physicsDebugger.init();

    return this;
  }

  playLevel = () => {
    // start game loop here. call init function of level actors
    this.actors.forEach((actor) => actor.init())

    this.renderer.setAnimationLoop(this.update);
  }

  update = () => {
    // Update time ticker
    this.ticker.update();
    const { deltaTime, deltaTimeCapped } = this.ticker;
    
    // TODO: Refactor physicObject to use level state
    {
      for (let i = 0; i < this.physicsObjects.length; i++) {
        const po = this.physicsObjects[i]
        const autoAnimate = po.autoAnimate

        if (autoAnimate) {
          const mesh = po.mesh
          const collider = po.collider
          mesh.position.copy(collider.translation() as Vector3)
          mesh.quaternion.copy(collider.rotation() as Quaternion)
        }

        const fn = po.fn
        fn && fn()
      }
    }
    
    /**
     * loop through all actors and call their update method with modified delta time in seconds
     */
    this.actors.forEach((actor) => actor.update(deltaTimeCapped / 1000));

    // update world physics (at last ?, or at first?)
    this.physicsWorld.step();
    // Update debuggers at the end
    this.physicsDebugger.update();

    // Render scene again by calling renderer
    this.renderer.render(this.scene, this.camera);
    
    // Update FPS stats
    this.stats.update();
  }
}

export default MainLevel;
