import RAPIER from '@dimforge/rapier3d';
import { BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineSegments, Mesh, Object3DEventMap, Scene } from 'three';
import LevelActor from '../../levels/interfaces/LevelActor';

class PhysicsDebugRenderer implements LevelActor {
  group: Group;
  scene: Scene;
  mesh: LineSegments;
  world: RAPIER.World
  enabled: boolean

  constructor(scene: Scene, world: RAPIER.World) {
    this.enabled = true;
    this.scene = scene;
    this.world = world;
    this.group = new Group();
    this.mesh = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: '#ffffff', vertexColors: true }))
    this.mesh.frustumCulled = false;
  }
  
  init = () => {
    this.group.add(this.mesh);

    this.scene.add(this.group);
    return this;
  };

  setEnabled = (enable: boolean) => {
    this.enabled = enable;
  } 

  update = () => {
    if(this.enabled) {
      const { vertices, colors } = this.world.debugRender();
      this.mesh.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      this.mesh.geometry.setAttribute('color', new BufferAttribute(colors, 4));
    } else {
      this.mesh.visible = false;
    }
  }
}

export default PhysicsDebugRenderer;
