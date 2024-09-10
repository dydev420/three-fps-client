// import { WebSocket } from "ws";
import { Vector2 } from "../server/lib/vector.mts";
import * as common from "../server/common.mts";
import type { Player } from "../server/common.mts";

export interface Game {
  // camera: 
  ws: WebSocket | undefined,
  me: Player | undefined,
  players: Map<number, Player>,
  ping: number,
}

export function createGame(): Game {
  // const ws = new WebSocket(`ws://localhost:${common.SERVER_PORT}`);
  const ws = new WebSocket(`ws://${window.location.hostname}:${common.SERVER_PORT}`);
  ws.binaryType = 'arraybuffer';
  const players = new Map();

  const game: Game = {
    ws,
    me: undefined,
    players,
    ping: 0,
  }

  ws.addEventListener('open', (event) => {
    console.log('On WebSocket OPEN', event);
  });

  ws.addEventListener('close', (event) => {
    console.log('On WebSocket CLOSE', event);
  });

  ws.addEventListener('message', async (event) => {
    const view = new DataView(event.data);
    if (game.me === undefined) {
      if (common.HelloStruct.verify(view)) {
        game.me = {
          id: common.HelloStruct.id.read(view),
          position: new Vector2(
            common.HelloStruct.x.read(view),
            common.HelloStruct.y.read(view),
          ),
          hue: common.HelloStruct.hue.read(view)/256*360,
          moving: 0,
          direction: common.HelloStruct.direction.read(view),
        };
        players.set(game.me.id, game.me);
        console.log('Connected Players', game.me);
      } else {
        console.log('Wrong Hello message received. Closing connection');
        ws.close();
      }
    } else {
      if(common.BatchHeaderStruct.verifyJoined(view)) {
        const count = common.BatchHeaderStruct.count.read(view);

        for (let i = 0; i < count ; i++) {
          const offset = common.BatchHeaderStruct.size + i* common.PlayerStruct.size;
          const playerView = new DataView(event.data, offset, common.PlayerStruct.size);

          const playerId = common.PlayerStruct.id.read(playerView);
          const player = players.get(playerId);

          if(player) {
            player.position.x = common.PlayerStruct.x.read(playerView);
            player.position.y = common.PlayerStruct.y.read(playerView);
            player.hue = common.PlayerStruct.hue.read(playerView)/256*360;
            player.direction = common.PlayerStruct.direction.read(playerView);
            player.moving = common.PlayerStruct.moving.read(playerView);
          } else {
            const x = common.PlayerStruct.x.read(playerView);
            const y = common.PlayerStruct.y.read(playerView);
            players.set(playerId, {
              id: playerId,
              position: new Vector2(x, y),
              direction: common.PlayerStruct.direction.read(playerView), // change this or BUGS
              moving: common.PlayerStruct.moving.read(playerView),
              hue: common.PlayerStruct.hue.read(playerView)/256*360,
            });
          } 
        }
      } else if (common.PlayerLeftStruct.verify(view)) {
        players.delete(common.PlayerLeftStruct.id.read(view));
        console.log('Payer Left -- id:', common.PlayerLeftStruct.id.read(view));
      } else if (common.BatchHeaderStruct.verifyMoved(view)) {
        const count = common.BatchHeaderStruct.count.read(view);

        for (let i = 0; i < count ; i++) {
          const offset = common.BatchHeaderStruct.size + i* common.PlayerStruct.size;
          const playerView = new DataView(event.data, offset);

          const playerId = common.PlayerStruct.id.read(playerView);
          const player = players.get(playerId);
          if(!player) {
            console.log('Unknown player id:', playerId);
            return;
          }
          player.moving = common.PlayerStruct.moving.read(playerView);
          player.direction = common.PlayerStruct.direction.read(playerView);
          player.position.x = common.PlayerStruct.x.read(playerView);
          player.position.y = common.PlayerStruct.y.read(playerView);
        }
      } else if (common.PingPongStruct.verifyPong(view)) {
          game.ping = performance.now() - common.PingPongStruct.timestamp.read(view);
      } else {
        console.log('Unexpected binary message');
        ws.close();
      }
    }
  });

  ws.addEventListener('error', (error) => {
    console.log('On WebSocket ERROR', error);
  });

  return game;
}

export function renderGame() {

}