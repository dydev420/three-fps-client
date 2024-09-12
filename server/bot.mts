import { WebSocket } from "ws";
import * as common from '../common/index.mjs';
import { SERVER_PORT, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SPEED } from '../common/helpers/constants';
import { Player, Moving, MessageKind } from "../common/types";
import { Vector2 } from "./lib/vector.mjs";
import BatchHeaderStruct from "../common/structs/BatchHeaderStruct";
import PlayerStruct from "../common/structs/PlayerStruct";
import HelloStruct from "../common/structs/HelloStruct";
import PlayerMovingStruct from "../common/structs/PlayerMovingStruct";

// Set number of bots
const TOTAL_BOTS = 20;

// const EPS = 1e-6;
const EPS = 10;
const BOT_FPS = 30;

interface Bot {
  ws: WebSocket,
  me: Player | undefined,
  goalX: number,
  goalY: number,
  timeoutBeforeTurn: number | undefined,
  previousTimestamp: number | undefined,
}

function createBot(): Bot {
  const bot: Bot =  {
    ws : new WebSocket(`ws://localhost:${SERVER_PORT}`),
    me : undefined,
    goalX : WORLD_WIDTH * 0.5,
    goalY : WORLD_HEIGHT * 0.5,
    timeoutBeforeTurn: undefined,
    previousTimestamp: Date.now(),
  };
  bot.ws.binaryType = 'arraybuffer';

  bot.ws.addEventListener('message', (event) => {
    if (!(event.data instanceof ArrayBuffer)) {
      return;
    }

    const view = new DataView(event.data);
    if (bot.me === undefined) {
      if (HelloStruct.verify(view)) {
        const helloMessage = HelloStruct.read(view);
        bot.me = {
          moving: 0,
          id: helloMessage.id,
          hue: helloMessage.hue/256*360,
          direction: helloMessage.direction,
          position: new Vector2(
            helloMessage.x,
            helloMessage.y,
          ),
        };
        // Start bot loop
        turn();
        console.log('Connected Bot id:', bot.me);
      } else {
          console.log('Wrong Hello message received. Closing connection', event);
          bot.ws.close();
        }
    } else {
      if (BatchHeaderStruct.verifyMoved(view)) {
        const count = BatchHeaderStruct.count.read(view);
        
        for (let i = 0; i < count ; i++) {
          const viewOffset = BatchHeaderStruct.size + i* PlayerStruct.size;
          const playerView = new DataView(event.data, viewOffset);
          const playerMessage = PlayerStruct.read(playerView);
          const playerId = playerMessage.id;
          if(bot.me && playerId === bot.me.id)  {
            bot.me.moving = playerMessage.moving;
            bot.me.position.x = playerMessage.x;
            bot.me.position.y = playerMessage.y;
          }
        }
      }
    }
  });

  // Bot loop
  const tick = () => {
    const timestamp = Date.now();
    const deltaTime = (timestamp - (bot.previousTimestamp ?? 0))/1000;
    bot.previousTimestamp = timestamp;
    
    if(bot.me !== undefined ) {
      common.updatePlayer(bot.me, deltaTime);
    }
    // Bot loop
    if (bot.timeoutBeforeTurn !== undefined) {
      bot.timeoutBeforeTurn -= deltaTime;
      if (bot.timeoutBeforeTurn <= 0) {
        turn();
      }
    }

    // Continue looping
    setTimeout(tick, 1000 / BOT_FPS);
  }

  setTimeout(() => {
    bot.previousTimestamp = Date.now();
    tick();
  }, 1000 / BOT_FPS);

  function turn() {
    if (bot.me !== undefined) {
      const view = new DataView(new ArrayBuffer(PlayerMovingStruct.size));

      // Full stop
      for (let direction = 0; direction < Moving.Count; ++direction) {
        if ((bot.me.moving >> direction) & 1) {
          PlayerMovingStruct.write(view, {
            kind: MessageKind.PlayerMoving,
            direction,
            start: 0,
          });
          bot.ws.send(view);
        }
      }

      // New direction
      const direction = Math.floor(Math.random() * Moving.Count);
      bot.timeoutBeforeTurn = Math.random() * WORLD_WIDTH * 0.5 / PLAYER_SPEED;

      // Sync
      PlayerMovingStruct.write(view, {
        kind: MessageKind.PlayerMoving,
        direction,
        start: 1,
      });
      bot.ws.send(view);
    }
  }

  return bot;
}


let bots: Array<Bot> = [];
for (let i = 0; i < TOTAL_BOTS; i++) {
  bots.push(createBot());
}


console.log("Hello from Bot");
