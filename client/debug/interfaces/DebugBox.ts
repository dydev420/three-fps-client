import { Mesh, Scene } from 'three';
import { Player } from '../../../common/types';

interface DebugBox {
  selfUpdate: boolean;
  mesh: Mesh;
  player: Player;
  update: (scene: Scene ,deltaTime: number) => void;
  delete: (scene: Scene) => void;
}

export default DebugBox;
