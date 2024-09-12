import * as ws from "ws";
import { Vector2, Vector3 } from "../server/lib/vector.mjs";
import { Player, Moving, Field, MessageKind,  } from './types';
import {
  PLAYER_SIZE,
  PLAYER_SPEED,
} from './helpers/constants' ;


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
