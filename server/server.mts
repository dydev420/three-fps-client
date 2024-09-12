import 'dotenv/config';

import { WebSocketServer, WebSocket } from "ws";
import { Vector2 } from "./lib/vector.mjs";
import * as common from '../common/index.mjs';
import { SERVER_PORT, SERVER_FPS, WORLD_WIDTH, WORLD_HEIGHT, } from '../common/helpers/constants';
import { Player, MessageKind } from "../common/types";
import PingPongStruct from '../common/structs/PingPongStruct';
import app from "./app.mts";
import PlayerMovingStruct from '../common/structs/PlayerMovingStruct';
import PlayerTurningStruct from '../common/structs/PlayerTurningStruct';
import BatchHeaderStruct from '../common/structs/BatchHeaderStruct';
import PlayerStruct from '../common/structs/PlayerStruct';
import PlayerLeftStruct from '../common/structs/PlayerLeftStruct';
import HelloStruct from '../common/structs/HelloStruct';


// init express server to serve html
const httpServer = app.listen(process.env.PORT, () => console.log('Express Server Started on PORT:', process.env.PORT));

// init WebSocket server for multiplayer connections
const wss = new WebSocketServer({
  // port: common.SERVER_PORT as number,
  server: httpServer,
});

console.log(`Listening on wss://localhost:${SERVER_PORT}`);

/**
 * Multiplayer Websocket server
 */
const STATS_AVERAGE_CAPACITY = 30;

interface Stats {
  startedAt: number,
  upTime: number,
  tickCount: number,
  tickTimes: Array<number>,
  messagesSent: number,
  messagesReceived: number,
  tickMessagesSent: Array<number>,
  tickMessagesReceived: Array<number>,
  bytesSent: number,
  bytesReceived: number,
  tickBytesSent: Array<number>,
  tickBytesReceived: Array<number>,
  playersCount: number,
  playersJoined: number,
  playersLeft: number,
  rejectedMessages: number,
}

const stats: Stats = {
  // tick counter
  startedAt: performance.now(),
  upTime: 0,
  tickCount: 0,
  tickTimes: [],
  
  // messages
  messagesSent: 0,
  messagesReceived: 0,
  tickMessagesSent: [],
  tickMessagesReceived: [],
  
  // bytes
  bytesSent: 0,
  bytesReceived: 0,
  tickBytesSent: [],
  tickBytesReceived: [],

  // players
  playersCount: 0,
  playersJoined: 0,
  playersLeft: 0,

  // errors
  rejectedMessages: 0,
};

function average(xs: Array<number>) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function pushAverage(xs: Array<number>, value: number) {
  if(xs.push(value) > STATS_AVERAGE_CAPACITY) {
    xs.shift();
  }
}

function printStats() {
  console.log('Stats -- ::');
  console.log('- Server Uptime s', (stats.upTime) / 1000);
  console.log('- Tick Count', stats.tickCount);
  console.log('- Avg tick time ms', average(stats.tickTimes));
  console.log('- Total messages sent', stats.messagesSent);
  console.log('- Total messages received', stats.messagesReceived);
  console.log('- Avg Tick messages sent', average(stats.tickMessagesSent));
  console.log('- Avg Tick messages received', average(stats.tickMessagesReceived));
  console.log('- Total bytes sent', stats.bytesSent);
  console.log('- Total bytes received', stats.bytesReceived);
  console.log('- Avg Tick bytes sent', average(stats.tickBytesSent));
  console.log('- Avg Tick bytes received', average(stats.tickBytesReceived));
  console.log('- Avg Tick bytes received', stats.tickBytesReceived.length);
  console.log('- Active players', stats.playersCount);
  console.log('- Total players joined', stats.playersJoined);
  console.log('- Total players left', stats.playersLeft);
  console.log('- Total Rejected Messages', stats.rejectedMessages);
}

interface PlayerOnServer extends Player {
  ws: WebSocket,
  newDirection: number,
  newMoving: number,
  turned: boolean,
}

const players = new Map<number, PlayerOnServer>()
let idCounter = 0;
let bytesReceivedWithinTick = 0;
let messagesReceivedWithinTick = 0;
const joinedIds = new Set<number>();
const leftIds = new Set<number>();
const pingIds = new Map<number, number>();

const randomHue = () => {
  return Math.floor(Math.random() * 360);
}

wss.on('connection', (ws) => {
  ws.binaryType = 'arraybuffer';

  const id = idCounter++;
  const x = Math.random() * WORLD_WIDTH;
  const y = Math.random() * WORLD_HEIGHT;
  const position = new Vector2(x, y);
  const hue = randomHue();
  const player = {
    ws,
    id,
    position,
    hue,
    direction: 0,
    moving: 0,
    newMoving: 0,
    newDirection: 0,
    turned: false,
  };

  console.log(`** Client id:${id} Connected.`);

  players.set(id, player);
  joinedIds.add(id);

  // update stats
  stats.playersJoined += 1;
  
  ws.addEventListener('message', (event) => {
    // update stats
    stats.messagesReceived += 1;
    stats.bytesReceived += event.data.toString().length;
    bytesReceivedWithinTick += event.data.toString().length;
    messagesReceivedWithinTick += 1;
    
    if (event.data instanceof ArrayBuffer) {
      const view = new DataView(event.data);
      
      if (PlayerMovingStruct.verify(view)) {
        const { direction, start } = PlayerMovingStruct.read(view);
        player.newMoving = common.applyDirectionMask(player.newMoving, direction, start)
      } else if (PlayerTurningStruct.verify(view)) {
        player.newDirection = PlayerTurningStruct.direction.read(view);
        player.turned = true;
      } else if (PingPongStruct.verifyPing(view)) {
        pingIds.set(id, PingPongStruct.timestamp.read(view));
      } else {
          stats.rejectedMessages += 1;
          console.log('Received unexpected message type');
          ws.close();
        }
    } else {
      console.log('Did not receive binary data');
      ws.close();
    }
  });

  ws.on('close', (event) => {
    console.log(`* Client id:${id} GONE.`);
    players.delete(id);
    if(!joinedIds.delete(id)) {
      leftIds.add(id);
    }
    
    // Update stats
    stats.playersLeft += 1;
  });
});

let previousTimestamp = 0;
const tick = () => {
  // States stuff
  const beginMs = performance.now();
  const messageCounter = {
    count: 0,
    bytesCount: 0,
  };

  const timestamp = Date.now();
  const deltaTime = (timestamp - previousTimestamp)/1000;
  previousTimestamp = timestamp;

  // Initialize new joined players
  {
    const playerCount = players.size;
    const buffer = new ArrayBuffer(BatchHeaderStruct.size + playerCount * PlayerStruct.size)
    const headerView = new DataView(buffer, 0, BatchHeaderStruct.size);
    BatchHeaderStruct.kind.write(headerView, MessageKind.PlayerJoined);
    BatchHeaderStruct.count.write(headerView, playerCount);
    
    
    let playerIndex = 0;
    // Add existing players data to the message
    players.forEach((player) => {
      const playerView = new DataView(buffer, BatchHeaderStruct.size + playerIndex * PlayerStruct.size);
      PlayerStruct.write(playerView, {
        id: player.id,
        x: player.position.x,
        y: player.position.y,
        direction: player.direction,
        moving: player.moving,
        hue: Math.floor(player.hue/360*256),
      });
    
      playerIndex++;
    });

    // Welcome all new joined players
    joinedIds.forEach((playerId) => {
      const joinedPlayer = players.get(playerId);
      if (joinedPlayer !== undefined) {
        const helloView = new DataView(new ArrayBuffer(HelloStruct.size));
        HelloStruct.write(helloView, {
          kind: MessageKind.Hello,
          id: joinedPlayer.id,
          x: joinedPlayer.position.x,
          y: joinedPlayer.position.y,
          direction: joinedPlayer.direction,
          hue: joinedPlayer.hue/360*256,
        });
        
        // Hello
        joinedPlayer.ws.send(helloView);
        // Reconstruct all other players in new player's state
        joinedPlayer.ws.send(buffer);
      } 
    });
  }
  

  // Notify existing players about new players
  if (joinedIds.size) {
    const playerCount = players.size;
    const buffer = new ArrayBuffer(BatchHeaderStruct.size + playerCount * PlayerStruct.size)
    const headerView = new DataView(buffer, 0, BatchHeaderStruct.size);
    BatchHeaderStruct.kind.write(headerView, MessageKind.PlayerJoined);

    // use player index to keep track of added players to buffer and set count in buffer
    let playerIndex = 0;
    // Notify all players others about who joined
    joinedIds.forEach((playerId) => {
      const otherPlayer = players.get(playerId);
      if (otherPlayer !== undefined) {
        const playerView = new DataView(buffer, BatchHeaderStruct.size + playerIndex * PlayerStruct.size);
        PlayerStruct.write(playerView, {
          id: otherPlayer.id,
          x: otherPlayer.position.x,
          y: otherPlayer.position.y,
          direction: otherPlayer.direction,
          moving: otherPlayer.moving,
          hue: Math.floor(otherPlayer.hue/360*256),
        });
        
        playerIndex++;
      }
    });
    BatchHeaderStruct.count.write(headerView, playerIndex);

    // Send to only old players
    players.forEach((player) => {
      if(!joinedIds.has(player.id)) {
        player.ws.send(buffer);
      }
    });
  }

  // Notifying about who left
  leftIds.forEach((leftId) => {
    const view = new DataView(new ArrayBuffer(PlayerLeftStruct.size));
    PlayerLeftStruct.write(view, {
      kind: MessageKind.PlayerLeft,
      id: leftId,
    });
    players.forEach((player) => {
      player.ws.send(view);
    });
  });

  
  // Notify players about movement
  {
    let movedCount = 0;
    players.forEach((player) => {
      if (
          player.newMoving !== player.moving
          || (player.turned && player.newDirection !== player.direction)
        ) {
        movedCount++;
      } else if (player.turned) {
        player.turned = false;
      }
    });
    if (movedCount) {
      const buffer = new ArrayBuffer(BatchHeaderStruct.size + movedCount * PlayerStruct.size);
      const headerView = new DataView(buffer, 0, BatchHeaderStruct.size);
      BatchHeaderStruct.kind.write(headerView, MessageKind.PlayerMoved);
      BatchHeaderStruct.count.write(headerView, movedCount);
      
      let movedIndex = 0;
      players.forEach((player) => {
        let moved = false;
        if (player.newMoving !== player.moving) {
          player.moving = player.newMoving;
          moved = true;
        } else if (player.turned && player.newDirection !== player.direction) {
          player.direction = player.newDirection;
          moved = true;
        }
    
        if (moved){
          const offset = BatchHeaderStruct.size + movedIndex * PlayerStruct.size;
          const playerView = new DataView(buffer, offset, PlayerStruct.size);
          PlayerStruct.write(playerView, {
            id: player.id,
            x: player.position.x,
            y: player.position.y,
            direction: player.direction,
            moving: player.moving,
            hue: Math.floor(player.hue/360*256),
          });
          movedIndex++;
        }
      });
    
      players.forEach((otherPlayer) => {
        otherPlayer.ws.send(buffer);
      });
    }
  }
  
  // Update Engine tick
  players.forEach((player) => common.updatePlayer(player, deltaTime));  
  
  // returning pings
  pingIds.forEach((timestamp, id) => {
    const player = players.get(id);
    if (player !== undefined) {
      const view = new DataView(new ArrayBuffer(PingPongStruct.size));
      PingPongStruct.write(view, {
        timestamp,
        kind: MessageKind.Pong,
      });
      player.ws.send(view);
    }
  });

  /**
   * Update stats
  */
  const tickTime = performance.now() - beginMs;
  pushAverage(stats.tickTimes, tickTime)  
  
  stats.tickCount += 1;
  stats.messagesSent += messageCounter.count;
  pushAverage(stats.tickMessagesSent, messageCounter.count);
  pushAverage(stats.tickMessagesReceived, messagesReceivedWithinTick);
  stats.bytesSent += messageCounter.bytesCount;
  pushAverage(stats.tickBytesSent, messageCounter.bytesCount);
  pushAverage(stats.tickBytesReceived, bytesReceivedWithinTick);
  stats.playersCount = players.size;
  stats.upTime = performance.now() - stats.startedAt;
  if (stats.tickCount % SERVER_FPS === 0) {
  //  printStats();
  }
  
  // Reset event queue and loop again
  joinedIds.clear();
  leftIds.clear();
  pingIds.clear();
  bytesReceivedWithinTick = 0;
  messagesReceivedWithinTick = 0;
  setTimeout(tick, 1000/SERVER_FPS);
}

// Start Server Tick
setTimeout(() => {
  previousTimestamp = Date.now();
  tick();
}, 1000/SERVER_FPS);
