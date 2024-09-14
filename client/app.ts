import { Vector3 } from 'three'
import {
  addPass,
  useCamera,
  useGame,
  // useControls,
  useGui,
  usePhysics,
  useRenderer,
  // useLoader,
  useRenderSize,
  useScene,
} from './render/init'


import { addPhysics } from './render/physics/physics'


import { WORLD_HEIGHT, WORLD_WIDTH } from '../common/helpers/constants'
import MainLevel from './levels/MainLevel'
import CubesManager from './levels/actors/CubesManager'
import { addInputListeners } from './gameInput';
import DebugManager from './debug/DebugManager';
import PawnManager from './render/pawn/PawnManager';

const MOTION_BLUR_AMOUNT = 0.5

const startApp = async () => {
  // three
  const renderer = useRenderer();
  const scene = useScene();
  const camera = useCamera();
  const game = useGame();
  const physicsWorld = usePhysics();

  camera.position.x += 10;
  camera.position.y += 10;
  camera.lookAt(new Vector3(0));
  const gui = useGui();


  /**
   * Register input listeners
   */
  addInputListeners(game);

  
  /**
   * Set up empty main level
   */
  const mainLevel = new MainLevel(renderer, scene, camera, physicsWorld);
  mainLevel.init(); // could turn async later
  
  /**
   * Add actors and meshes before playing level
   */
  const cubesManager = new CubesManager(scene);
  mainLevel.addActor(cubesManager);

  const pawnManager = new PawnManager(scene, game, camera);
  mainLevel.addActor(pawnManager);

  const debugManager = new DebugManager(scene, game, false);
  mainLevel.addActor(debugManager);

  /**
   * Inits all actor and starts playing level game loop 
   * */
  mainLevel.playLevel();
}

export default startApp;
