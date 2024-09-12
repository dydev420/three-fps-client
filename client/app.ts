import { AmbientLight, BoxGeometry, Color, DirectionalLight, DirectionalLightHelper, DoubleSide, Mesh, MeshPhysicalMaterial, PlaneGeometry, Vector3 } from 'three'
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

// import postprocessing passes
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { addPhysics } from './render/physics/physics'


import { TickData } from './render/tickManager';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../common/common.mts'

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

  const dirLight = new DirectionalLight('#ffffff', 1)
  dirLight.position.y += 1
  dirLight.position.x += 0.5

  const dirLightHelper = new DirectionalLightHelper(dirLight)
  // dirLight.add(dirLightHelper)

  const ambientLight = new AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)


  // * APP

  const _addGroundMesh = () => {
    // * Settings
    const planeWidth = 100
    const planeHeight = 100

    // * Mesh
    const geometry = new PlaneGeometry(planeWidth, planeHeight)
    const material = new MeshPhysicalMaterial({
      color: '#333',
      side: DoubleSide,
      // wireframe: true,
    })
    const plane = new Mesh(geometry, material);
    plane.position.y -= 1.5;

    // * Physics
    const collider = addPhysics(
      plane,
      'fixed',
      true,
      () => {
        plane.rotation.x -= Math.PI / 2
      },
      'cuboid',
      {
        width: planeWidth / 2,
        height: 0.001,
        depth: planeHeight / 2,
      }
    ).collider

    // * Add the mesh to the scene
    scene.add(plane)
  }

  _addGroundMesh()

  const _addCubeMesh = (pos: Vector3) => {
    // * Settings
    const size = 1;

    // * Mesh
    const geometry = new BoxGeometry(size, size, size)
    const material = new MeshPhysicalMaterial({
      color: new Color().setHex(Math.min(Math.random() + 0.15, 1) * 0xffffff),
      side: DoubleSide,
    })
    const cube = new Mesh(geometry, material)

    cube.position.copy(pos)
    cube.position.y += 2

    // * Physics
    const collider = addPhysics(cube, 'dynamic', true, undefined, 'cuboid', {
      width: size / 2,
      height: size / 2,
      depth: size / 2,
    }).collider

    // * Add the mesh to the scene
    scene.add(cube)
  }

  const NUM_CUBES = 20
  // const NUM_CUBES = 0
  for (let i = 0; i < NUM_CUBES; i++) {
    _addCubeMesh(
      new Vector3((Math.random() - 0.5) * WORLD_WIDTH, 10 + i * 5, (Math.random() - 0.5) * WORLD_HEIGHT)
    )
  }

}

export default startApp