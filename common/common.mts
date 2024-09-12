import * as ws from "ws";
import { Vector2, Vector3 } from "../server/lib/vector.mjs";
import { Player, Moving, Field, MessageKind,  } from './types';


export const SERVER_PORT = 6969;
export const SERVER_FPS = 60;
export const WORLD_WIDTH = 8 * 100 * 0.1;
export const WORLD_HEIGHT = 6 * 100 * 0.1;
export const PLAYER_SIZE = 30 * 0.5;
export const PLAYER_SPEED = 20;

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

const UINT8_SIZE = 1;
const UINT16_SIZE = 2;
const UINT32_SIZE = 4;
const FLOAT32_SIZE = 4;

function allocUint8Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT8_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint8(offset),
    write: (view, value) => view.setUint8(offset, value),
  };
}

function allocUint16Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT16_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint16(offset),
    write: (view, value) => view.setUint16(offset, value),
  };
}

function allocUint32Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT32_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint32(offset, true),
    write: (view, value) => view.setUint32(offset, value, true),
  };
}

function allocFloat32Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = FLOAT32_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getFloat32(offset, true),
    write: (view, value) => view.setFloat32(offset, value, true),
  };
}

function verifier(kindField: Field, kind: number, size: number ): (view: DataView) => boolean {
  return (view: DataView) => view.byteLength === size && kindField.read(view) === kind;
} 

function structWriter(fields: {[key: string]: Field}) {
  return (view : DataView, props: {[key: string]: number}) => {
    for (const [key, value] of Object.entries(props)) {
      if(fields[key]) {
        fields[key].write(view, props[key]);
      }
    }
  };
}

function structReader(fields: {[key: string]: Field}) {
  return (view : DataView,) => {
    const props: {[x: string]: number | undefined} = {};
    for (const key of Object.keys(fields)) {
      if(fields[key]) {
        props[key] = fields[key].read(view);
      } else {
        props[key] = undefined;
      }
    }
    return props;
  };
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
