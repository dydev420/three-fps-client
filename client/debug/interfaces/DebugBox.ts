import { Mesh, Scene } from 'three';
import { Player } from '../../../server/common.mts';

interface DebugBox {
  selfUpdate: boolean;
  mesh: Mesh;
  player: Player;
  update: (scene: Scene ,deltaTime: number) => void;
  delete: (scene: Scene) => void;
}

export default DebugBox;
