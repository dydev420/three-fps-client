import * as THREE from 'three';
import { Game } from "../game";
import PlayerDebugBox from "./PlayerDebugBox";

class DebugManager {
  selfUpdate: boolean;
  scene: THREE.Scene;
  game: Game;
  playerBoxes: Map<number, PlayerDebugBox>;

  constructor(scene: THREE.Scene, game: Game, selfUpdate: boolean = false) {
    this.selfUpdate = selfUpdate;
    this.scene = scene;
    this.game = game;
    this.playerBoxes = new Map();
  }

  update(deltaTime: number) {
    if(this.game.players) {
      this.game.players.forEach((player) => {
        if(this.game.me?.id === player.id) {
          return;
        }

        let playerBox = this.playerBoxes.get(player.id);

        // Add debug box if not present for player
        if(!playerBox) {
          playerBox = new PlayerDebugBox(player, player.id, this.selfUpdate); // could be buggy
          
          this.playerBoxes.set(player.id, playerBox);
          this.scene.add(playerBox.mesh);
        }

        playerBox.update(this.scene, deltaTime);
      });
    }

    // Remove disconnected Boxes
    this.playerBoxes.forEach((box, boxId) => {
      if(!this.game.players.has(boxId)) {
        box.delete(this.scene);
        this.playerBoxes.delete(boxId);
      }
    });
  }
}

export default DebugManager;
