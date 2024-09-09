import * as THREE from 'three';
import type { Player } from '../../../server/common.mts';
import CharacterPawn from '../../render/pawn/CharacterPawn';

interface Character {
  pawn: CharacterPawn;
  position: THREE.Vector3;
  
  // mp states
  id: number;
  player: Player | undefined;

  update: (deltaTime: number) => void;
}

export default Character;