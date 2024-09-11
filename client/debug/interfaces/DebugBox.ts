import * as THREE from 'three';
import { Player } from '../../../server/common.mts';

interface DebugBox {
  selfUpdate: boolean;
  mesh: THREE.Mesh;
  player: Player;
  update: (scene: THREE.Scene ,deltaTime: number) => void;
  delete: (scene: THREE.Scene) => void;
}

export default DebugBox;
