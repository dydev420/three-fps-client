import { Vector3 } from 'three';
import type { Player } from '../../../common/types';
import CharacterPawn from '../../render/pawn/CharacterPawn';

interface Character {
  pawn: CharacterPawn;
  position: Vector3;
  
  // mp states
  id: number;
  player: Player | undefined;

  update: (deltaTime: number) => void;
  delete: () => void;
}

export default Character;