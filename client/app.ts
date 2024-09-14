import { Vector3 } from 'three'
import {
  addPass,
  useCamera,
  // useControls,
  useGui,
  // useLoader,
  useRenderSize,
  useScene,
  useTick,
} from './render/init'


import { addPhysics } from './render/physics/physics'


import { TickData } from './render/tickManager';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../common/helpers/constants'
import MainLevel from './levels/MainLevel'
import CubesManager from './levels/managers/CubesManager'

const MOTION_BLUR_AMOUNT = 0.5

const startApp = async () => {
  // three
  const scene = useScene()
  const camera = useCamera()
  camera.position.x += 10
  camera.position.y += 10
  camera.lookAt(new Vector3(0))
  const gui = useGui()
  // const { width, height } = useRenderSize()

  /**
   * Set up empty main level
   */
  const mainLevel = new MainLevel(scene);
  mainLevel.init(); // could turn async later
  
  /**
   * Add actors and meshes before playing level
   */
  // 
  const cubesManager = new CubesManager(scene);
  mainLevel.addActor(cubesManager);


  // Inits all actor and starts playing level game loop
  mainLevel.playLevel();
}

export default startApp