// import { WebSocket } from "ws";
import { Vector2 } from "../server/lib/vector.mts";
import * as common from "../common/common.mts";
import { Player } from "../common/types";
import PingPongStruct from "../common/structs/PingPongStruct";
import HelloStruct from "../common/structs/HelloStruct";
import BatchHeaderStruct from "../common/structs/BatchHeaderStruct";
import PlayerStruct from "../common/structs/PlayerStruct";
import PlayerLeftStruct from "../common/structs/PlayerLeftStruct";

export interface Game {
  // camera: 
  ws: WebSocket | undefined,
  me: Player | undefined,
  players: Map<number, Player>,
  ping: number,
}

export function createGame(): Game {
  // const ws = new WebSocket(`ws://localhost:${common.SERVER_PORT}`);
  const wsUrl = common.getConnectionUrl(new URL(window.location.href));
  const ws = new WebSocket(wsUrl);
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
      if (HelloStruct.verify(view)) {
        game.me = {
          id: HelloStruct.id.read(view),
          position: new Vector2(
            HelloStruct.x.read(view),
            HelloStruct.y.read(view),
          ),
          hue: HelloStruct.hue.read(view)/256*360,
          moving: 0,
          direction: HelloStruct.direction.read(view),
        };
        players.set(game.me.id, game.me);
        console.log('Connected Players', game.me);
      } else {
        console.log('Wrong Hello message received. Closing connection');
        ws.close();
      }
    } else {
      if(BatchHeaderStruct.verifyJoined(view)) {
        const count = BatchHeaderStruct.count.read(view);

        for (let i = 0; i < count ; i++) {
          const offset = BatchHeaderStruct.size + i* PlayerStruct.size;
          const playerView = new DataView(event.data, offset, PlayerStruct.size);

          const playerId = PlayerStruct.id.read(playerView);
          const player = players.get(playerId);

          if(player) {
            player.position.x = PlayerStruct.x.read(playerView);
            player.position.y = PlayerStruct.y.read(playerView);
            player.hue = PlayerStruct.hue.read(playerView)/256*360;
            player.direction = PlayerStruct.direction.read(playerView);
            player.moving = PlayerStruct.moving.read(playerView);
          } else {
            const x = PlayerStruct.x.read(playerView);
            const y = PlayerStruct.y.read(playerView);
            players.set(playerId, {
              id: playerId,
              position: new Vector2(x, y),
              direction: PlayerStruct.direction.read(playerView), // change this or BUGS
              moving: PlayerStruct.moving.read(playerView),
              hue: PlayerStruct.hue.read(playerView)/256*360,
            });
          } 
        }
      } else if (BatchHeaderStruct.verifyMoved(view)) {
        const count = BatchHeaderStruct.count.read(view);

        for (let i = 0; i < count ; i++) {
          const offset = BatchHeaderStruct.size + i* PlayerStruct.size;
          const playerView = new DataView(event.data, offset);

          const playerId = PlayerStruct.id.read(playerView);
          const player = players.get(playerId);
          if(!player) {
            console.log('Unknown player id:', playerId);
            return;
          }
          player.moving = PlayerStruct.moving.read(playerView);
          player.direction = PlayerStruct.direction.read(playerView);
          player.position.x = PlayerStruct.x.read(playerView);
          player.position.y = PlayerStruct.y.read(playerView);
        }
      } else if (PlayerLeftStruct.verify(view)) {
        players.delete(PlayerLeftStruct.id.read(view));
        console.log('Payer Left -- id:', PlayerLeftStruct.id.read(view));
      } else if (PingPongStruct.verifyPong(view)) {
          game.ping = performance.now() - PingPongStruct.timestamp.read(view);
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