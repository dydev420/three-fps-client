import RAPIER from '@dimforge/rapier3d';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh, Scene } from 'three';

class PhysicsDebugRenderer {
  mesh: LineSegments;
  world: RAPIER.World
  enabled: boolean

  constructor(scene: Scene, world: RAPIER.World) {
    this.enabled = true;
    this.world = world;
    this.mesh = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: '#ffffff', vertexColors: true }))
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update() {
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
