import * as ws from "ws";
import { Vector2, Vector3 } from "../server/lib/vector.mjs";
import { Player, Moving, Field, MessageKind,  } from './types';
import {
  PLAYER_SIZE,
  PLAYER_SPEED,
} from './helpers/constants' 
import {
  allocFloat32Field,
  allocUint16Field,
  allocUint32Field,
  allocUint8Field
} from './helpers/allocators';
import {
  verifier,
  structWriter,
  structReader,
} from './helpers/structs';


export const getConnectionUrl = (url: URL) => {
  let { protocol, hostname, port } = url;
  let wsProtocol = 'ws:'

  // use wss for secure http connections
  if(protocol === 'https:') {
    wsProtocol = 'wss:';
  }

  return wsProtocol
    + '//'
    + hostname
    + (port?.length ? `:${port}` : '');
}

export function properMod(a: number, b: number) {
  return (a % b + b) % b;
}

export function checkDirectionMask(moving: number, dir: number): number {
  return (moving>>dir)&1;
}

export function applyDirectionMask(moving: number, dir: number, start: number = 0): number {
  return start ? moving|(1<<dir) : moving&~(1<<dir);
}

export const PingPongStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind : allocUint8Field(allocator),
    timestamp : allocUint32Field(allocator),
  };
  type PingPongFields = keyof typeof fields;  
  const helpers = {
    verifyPing: verifier(fields.kind, MessageKind.Ping, allocator.size),
    verifyPong: verifier(fields.kind, MessageKind.Pong, allocator.size),
    write: structWriter(fields) as (view : DataView, props: {[key in PingPongFields]: number}) => void,
    read: structReader(fields) as (view : DataView) => {[key in PingPongFields]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})();

export const HelloStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const id = allocUint32Field(allocator);
  const x = allocFloat32Field(allocator);
  const y = allocFloat32Field(allocator);
  const direction = allocFloat32Field(allocator);
  const hue = allocUint8Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.Hello, size);
  return { kind, id, x, y, direction, hue, size, verify };
})();

export const PlayerLeftStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const id = allocUint32Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerLeft, size);
  return { kind, id, size, verify };
})();

export const PlayerMovingStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const direction = allocUint8Field(allocator);
  const start = allocUint8Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerMoving, size);
  return { kind, direction, start, size, verify }
})()

export const PlayerTurningStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const direction = allocFloat32Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerTurning, size);
  return { kind, direction, size, verify }
})()

export const PlayerStruct = (() => {
  const allocator = { size: 0 };
  const id = allocUint32Field(allocator);
  const x = allocFloat32Field(allocator);
  const y = allocFloat32Field(allocator);
  const hue = allocUint8Field(allocator);
  const direction = allocFloat32Field(allocator);
  const moving = allocUint8Field(allocator);
  const size = allocator.size;
  return { id, x, y, hue, direction, moving, size };
})();

export const BatchHeaderStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const count = allocUint16Field(allocator);
  const size = allocator.size;
  const verifyMoved = (view: DataView) => {
    return view.byteLength >= size
      && (view.byteLength - size) % PlayerStruct.size === 0
      && kind.read(view) === MessageKind.PlayerMoved
  };
  const verifyJoined = (view: DataView) => {
    return view.byteLength >= size
      && (view.byteLength - size) % PlayerStruct.size === 0
      && kind.read(view) === MessageKind.PlayerJoined
  };
  return {kind, count, size, verifyMoved, verifyJoined };
})();

interface MessageCounter {
  count: number,
  bytesCount: number,
}

interface Message {
  kind: string
}

export function sendMessage<T extends Message>(socket: ws.WebSocket | WebSocket, message: T, messageCounter?: MessageCounter) {
  const payload = JSON.stringify(message);
  socket.send(payload);
  if (messageCounter) {
    messageCounter.count += 1;
    messageCounter.bytesCount += payload.length;
  }
}

/**
 * Engine
 */
export function fMod(a: number, b: number) {
  return (a % b + b) % b;
}

export function updatePlayer(player: Player, deltaTime: number) {
  const controlVelocity = new Vector2(0);
  let angularVelocity = 0.0;
  if (checkDirectionMask(player.moving, Moving.MovingForward)) {
      controlVelocity.add(new Vector2().setPolar(player.direction, PLAYER_SPEED))
  }
  if (checkDirectionMask(player.moving, Moving.MovingBackward)) {
      controlVelocity.sub(new Vector2().setPolar(player.direction, PLAYER_SPEED))
  }
  if (checkDirectionMask(player.moving, Moving.TurningLeft)) {
      angularVelocity -= Math.PI;
  }
  if (checkDirectionMask(player.moving, Moving.TurningRight)) {
      angularVelocity += Math.PI;
  }
  player.direction = player.direction + angularVelocity*deltaTime;
  player.position.add(controlVelocity.scale(deltaTime));
}

export function getPolarRotation(player: Player) {
  const center = player.position.clone();
  const end = new Vector2().setPolar(player.direction, PLAYER_SIZE).add(center);

  return [center, end];
}

export function getForwardDir(player: Player) {
  const [center, end] = getPolarRotation(player);

  return end.clone().sub(center).norm();
}

export function vec3D(vec2: Vector2): Vector3 {
  return new Vector3(vec2.x, 0, vec2.y);
}
