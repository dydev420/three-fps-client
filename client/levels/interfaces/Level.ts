import { Mesh, Scene } from "three";
import LevelActor from "./LevelActor";

interface Level {
  scene: Scene;
  ground: Mesh;
  actors: Map<number, LevelActor>;
  meshes: Map<number, Mesh>;
  init: () => this; // could be async later to return Promise<Level>
  playLevel: () => void;
  // pauseLoop: () => void;
  // stopLoop: () => void;
}

export default Level;
