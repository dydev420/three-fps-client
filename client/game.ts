// import { WebSocket } from "ws";
import { Vector2 } from "../server/lib/vector.mts";
import { getConnectionUrl } from "../common/index.mts";
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
  const wsUrl = getConnectionUrl(new URL(window.location.href));
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
        const helloMessage = HelloStruct.read(view);
        game.me = {
          moving: 0,
          id: helloMessage.id,
          hue: helloMessage.hue/256*360,
          direction: helloMessage.direction,
          position: new Vector2(
            helloMessage.x,
            helloMessage.y,
          ),
          seqId: helloMessage.seqId,
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

          const playerMessage = PlayerStruct.read(playerView);
          const playerId = playerMessage.id
          const player: Player = players.get(playerId);

          if(player) {
            player.position.x = playerMessage.x;
            player.position.y = playerMessage.y;
            player.hue = playerMessage.hue;
            player.direction = playerMessage.direction;
            player.moving = playerMessage.moving;
          } else {
            players.set(playerId, {
              id: playerId,
              position: new Vector2(playerMessage.x, playerMessage.y),
              direction: playerMessage.direction, // change this or BUGS
              moving: playerMessage.moving,
              hue: playerMessage.hue/256*360,
            } as Player);
          } 
        }
      } else if (BatchHeaderStruct.verifyMoved(view)) {
        const count = BatchHeaderStruct.count.read(view);

        for (let i = 0; i < count ; i++) {
          const offset = BatchHeaderStruct.size + i* PlayerStruct.size;
          const playerView = new DataView(event.data, offset);

          const playerMessage = PlayerStruct.read(playerView);
          const playerId = playerMessage.id
          const player: Player = players.get(playerId);
          if(!player) {
            console.log('Unknown player id:', playerId);
            return;
          }
          player.moving = playerMessage.moving;
          player.direction = playerMessage.direction;
          player.position.x = playerMessage.x;
          player.position.y = playerMessage.y;
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