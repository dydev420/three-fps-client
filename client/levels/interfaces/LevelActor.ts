import { Group, Scene } from "three";

interface LevelActor {
  scene: Scene;
  group: Group;
  init: () => this; // could be async later to return Promise<Level>
  playActor: () => void;
}

export default LevelActor;
