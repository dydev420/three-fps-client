import { Vector2 } from './lib/vector.mjs';
import * as common from '../common/common.mjs';
import { WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SIZE } from '../common/helpers/constants';
import { Player, Moving, MessageKind } from "../common/types";
import PingPongStruct from '../common/structs/PingPongStruct';
import BatchHeaderStruct from '../common/structs/BatchHeaderStruct';
import PlayerLeftStruct from '../common/structs/PlayerLeftStruct';
import PlayerStruct from '../common/structs/PlayerStruct';
import HelloStruct from '../common/structs/HelloStruct';
import PlayerMovingStruct from '../common/structs/PlayerMovingStruct';

const CANVAS_STRETCH = 10;

const DIRECTION_KEYS: {[key: string]: Moving} = {
  ArrowLeft: Moving.TurningLeft,
  ArrowRight: Moving.TurningRight,
  ArrowUp: Moving.MovingForward,
  ArrowDown: Moving.MovingBackward,
  KeyA: Moving.TurningLeft,
  KeyD: Moving.TurningRight,
  KeyW: Moving.MovingForward,
  KeyS: Moving.MovingBackward,
};

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
   ctx.beginPath();
   ctx.moveTo(p1.x, p1.y);
   ctx.lineTo(p2.x, p2.y);
   ctx.stroke();
}

function drawPlayerBody(ctx: CanvasRenderingContext2D, player: Player) {
  // Draw Player Body
  ctx.fillStyle = `hsl(${player.hue} 80% 40%)`;
  ctx.fillRect(player.position.x * CANVAS_STRETCH, player.position.y * CANVAS_STRETCH, PLAYER_SIZE, PLAYER_SIZE);

  // forward direction arrow
  ctx.strokeStyle = `hsl(${player.hue} 80% 50%)`;
  ctx.lineWidth = 4;
  const center = player.position.clone().scale(CANVAS_STRETCH).add(new Vector2(PLAYER_SIZE * 0.5, PLAYER_SIZE * 0.5));
  strokeLine(
    ctx,
    center,
    new Vector2().setPolar(player.direction, PLAYER_SIZE).scale(CANVAS_STRETCH * 0.2).add(center)
  );
}

function drawPlayerOutline(ctx: CanvasRenderingContext2D, player: Player) {
  const xPos = (player.position.x * CANVAS_STRETCH) - 5 ;
  const yPos = (player.position.y * CANVAS_STRETCH) - 5;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(xPos, yPos, PLAYER_SIZE + 10, PLAYER_SIZE + 10);
}

(async () => {
  const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
  gameCanvas.width = WORLD_WIDTH * CANVAS_STRETCH;
  gameCanvas.height = WORLD_HEIGHT * CANVAS_STRETCH;

  const ctx = gameCanvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas not supported');

  
  /**
   * States
   */
  // replicated state
  let me : Player | undefined = undefined;
  const players = new Map<number, Player>();
  let ping = 0;

  /**
   * WebSocket
   */
  // const ws = new WebSocket(`ws://localhost:${common.SERVER_PORT}`);
  const wsUrl = common.getConnectionUrl(new URL(window.location.href));
  let ws: WebSocket | undefined = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';
 
  ws.addEventListener('open', (event) => {
    console.log('On WebSocket OPEN', event);
  });

  ws.addEventListener('close', (event) => {
    console.log('On WebSocket CLOSE', event);
    ws = undefined;
  });

  ws.addEventListener('message', async (event) => {
    if (me === undefined) {
      if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        if (HelloStruct.verify(view)) {
          me = {
            id: HelloStruct.id.read(view),
            position: new Vector2(
              HelloStruct.x.read(view),
              HelloStruct.y.read(view),
            ),
            hue: HelloStruct.hue.read(view)/256*360,
            moving: 0,
            direction: HelloStruct.direction.read(view),
          };
          players.set(me.id, me);
          console.log('Connected Players', me);
        } else {
          console.log('Wrong Hello message received. Closing connection');
          ws?.close();
        }
      } 
    } else {
      if(event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
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
        } else if (PlayerLeftStruct.verify(view)) {
          players.delete(PlayerLeftStruct.id.read(view));
          console.log('Payer Left -- id:', PlayerLeftStruct.id.read(view));
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
        } else if (PingPongStruct.verifyPong(view)) {
            ping = performance.now() - PingPongStruct.timestamp.read(view);
        } else {
          console.log('Unexpected binary message');
          ws?.close();
        }
      }
    }
  });

  ws.addEventListener('error', (error) => {
    console.log('On WebSocket ERROR', error);
  });

  /**
   * Game Loop
   */
  const PING_COOL_DOWN = 60;
  let previousTimestamp = 0;
  let pingCoolDown = PING_COOL_DOWN;
  const frame = (timestamp: number) => {
    const deltaTime = (timestamp - previousTimestamp)/1000;
    previousTimestamp = timestamp;    

    // loop logic
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!ws || !ws.readyState) {
      const label = "Not Connected";
      const labelSize = ctx.measureText(label);
      ctx.font = "32px bold";
      ctx.fillStyle = "#faaaaa";
      ctx.fillText(label, ctx.canvas.width/2 - labelSize.width/2, ctx.canvas.height/2 - labelSize.width/2);
    } else {
      // Player game loop
      players.forEach((player) => {
        // Update all player physics
        common.updatePlayer(player, deltaTime);
        
        if(player.id !== me?.id ) {
          drawPlayerBody(ctx, player);
        }
      });
      
      // Draw current player on top with outline
      if(me) {
        drawPlayerOutline(ctx, me);
        drawPlayerBody(ctx, me);
      }

      // render ping stats
      ctx.font = "24px bold";
      ctx.fillStyle = "white";
      const pingPadding = ctx.canvas.width*0.05;
      ctx.fillText(`Ping: ${ping.toFixed(2)}ms`, pingPadding, pingPadding);
  
      // Send Ping to server
      pingCoolDown -= 1;
      if (ws?.readyState && pingCoolDown <= 0) {
        const view = new DataView(new ArrayBuffer(PingPongStruct.size));
        PingPongStruct.write(view, {
          kind: MessageKind.Ping,
          timestamp: performance.now(),
        });
        ws.send(view);
  
        pingCoolDown = PING_COOL_DOWN;
      }
    }

    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame((timestamp) => {
    previousTimestamp = timestamp;
    window.requestAnimationFrame(frame);
  });

  /**
   * Input Handlers
   */
  window.addEventListener('keydown', (e) => {
    if(me === undefined || ws === undefined) {
      return;
    }
    if (!e.repeat) {
      const direction = DIRECTION_KEYS[e.code];
      if (direction !== undefined) {
        const view = new DataView(new ArrayBuffer(PlayerMovingStruct.size));
        PlayerMovingStruct.kind.write(view, MessageKind.PlayerMoving);
        PlayerMovingStruct.start.write(view, 1);
        PlayerMovingStruct.direction.write(view, direction);
        
        ws.send(view);
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    if(me === undefined || ws === undefined) {
      return;
    }
    if (!e.repeat) {
      
      const direction = DIRECTION_KEYS[e.code];
      if (direction !== undefined) {
        const view = new DataView(new ArrayBuffer(PlayerMovingStruct.size));
        PlayerMovingStruct.kind.write(view, MessageKind.PlayerMoving);
        PlayerMovingStruct.start.write(view, 0);
        PlayerMovingStruct.direction.write(view, direction);
        ws.send(view);
      }
    }
  });
})();
