import { Group, Mesh, Object3D, Scene, Vector3 } from 'three';
import { addPhysics, PhysicsObject } from '../../render/physics/physics';
import { getCubeMesh } from '../../helpers/meshes';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../../common/helpers/constants';
import LevelActor from '../interfaces/LevelActor';

const NUM_CUBES = 20;

type PhysicsCube = {
  mesh: Mesh,
  physicsObject: PhysicsObject,
}

class CubesManager implements LevelActor {
  scene: Scene;
  group: Group;

  cubes: Array<PhysicsCube>

  constructor(scene: Scene) {
    this.scene = scene;
    this.group = new Group();
    this.cubes = [];
  }

  init = () => {
    const size = 1;
    for (let i = 0; i < NUM_CUBES; i++) {
      const cubeMesh = getCubeMesh(new Vector3((Math.random() - 0.5) * WORLD_WIDTH, 10 + i * 5, (Math.random() - 0.5) * WORLD_HEIGHT));
      const cube: PhysicsCube = {
        mesh: cubeMesh,
        physicsObject: addPhysics(cubeMesh, 'dynamic', true, undefined, 'cuboid', {
          width: size / 2,
          height: size / 2,
          depth: size / 2,
        }),
      }

      this.group.add(cubeMesh);
      this.cubes.push(cube);
    }

    // Add Manager Object3D to scene
    this.scene.add(this.group);
  
    return this;
  }

  playActor = () => {
    // empty??
  };

  update = (deltaTime: number) => {
    
  }
}

export default CubesManager;
