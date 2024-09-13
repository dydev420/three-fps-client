import { Vector2, Vector3 } from "../server/lib/vector.mjs";

export enum Moving {
  MovingForward = 0,
  MovingBackward,
  TurningLeft,
  TurningRight,
  Count,
}
export interface Player {
  id: number,
  position: Vector2,
  direction: number,
  moving: number,
  hue: number,
  seqId: number,
}

export interface Field {
  offset: number,
  size: number,
  read(view: DataView): number,
  write(view: DataView, value: number): void,
}

export enum MessageKind {
  Ping,
  Pong,
  Hello,
  PlayerJoined,
  PlayerLeft,
  PlayerMoved,
  PlayerMoving,
  PlayerTurning,
}