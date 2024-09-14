import { AmbientLight, DirectionalLight, Group, Object3D, Object3DEventMap, Scene } from "three";
import LevelActor from "../interfaces/LevelActor";

class EnvLight implements LevelActor {
  scene: Scene;
  group: Group;
  dirLight: DirectionalLight;
  ambientLight: AmbientLight;

  constructor(scene: Scene) {
    this.scene = scene;
    this.group = new Group();
    this.dirLight =  new DirectionalLight('#ffffff', 1);
    this.ambientLight = new AmbientLight('#ffffff', 0.5);

    this.dirLight.position.y += 1;
    this.dirLight.position.x += 0.5;
  }

  init = () => {
    this.group.add(this.dirLight, this.ambientLight);
    this.scene.add(this.group);

    return this;
  }

  playActor = () => {
    /// idk 
  }

  update = (deltaTime: number) => {
    // each frame
  }
}

export default EnvLight;