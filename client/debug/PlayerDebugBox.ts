import { ArrowHelper, BoxGeometry, Mesh, Color, MeshStandardMaterial, Scene, Vector3 } from 'three';
import DebugBox from "./interfaces/DebugBox";
import { getForwardDir, updateEnginePlayer, vec3D } from '../../common/index.mjs'
import type { Player } from '../../common/types';


class PlayerDebugBox implements DebugBox {
  selfUpdate: boolean;
  id: number;
  player: Player;
  geometry: BoxGeometry;
  material: MeshStandardMaterial;
  mesh: Mesh;
  arrow: ArrowHelper | undefined;

  constructor(player: Player, id: number, selfUpdate: boolean = false) {
    this.selfUpdate = selfUpdate;
    this.player = player;
    this.id = id;

    // three js stuff
    this.geometry = new BoxGeometry(1, 1, 1);
    this.material = new MeshStandardMaterial({
      color: new Color().setHSL(player.hue/360, 0.8, 0.5),
    })
    this.mesh = new Mesh(this.geometry, this.material);
  }

  renderInScene(scene: Scene) {
    if(this.mesh) {
      scene.add(this.mesh);
    }
  }

  updateMesh(player: Player) {
    if(player) {
      const { position } = player;
      
      // Update position
      this.mesh.position.x = position.x;
      this.mesh.position.z = position.y;
    }
  }

  updateArrow(player: Player, scene: Scene) {
    if(this.arrow) {
      this.arrow.dispose();
      scene.remove(this.arrow);
    }

    if(player) {
      const forwardDir = vec3D(getForwardDir(player));
      const playerPosition = vec3D(player.position);
      const forwardVector = new Vector3(forwardDir.x, forwardDir.y, forwardDir.z);
      const origin = new Vector3(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z,
      );

      this.arrow = new ArrowHelper(forwardVector, origin, 3, 'purple')
      scene.add(this.arrow);
    }
  }
  
  update(scene: Scene, deltaTime: number): void {
    if(this.player) {
      // only call player physics update if selfUpdating
      // (use selfUpdating when there is no real network pawn controller in the scene)
      if(this.selfUpdate) {
        updateEnginePlayer(this.player, deltaTime);
      }

      // update mesh immediately after updating player on engine
      // all other update methods can use 3d position of mesh
      this.updateMesh(this.player);
      
      // update other 3d objects
      this.updateArrow(this.player, scene);    
    }
  };

  delete(scene: Scene): void {
    this.geometry.dispose();
    this.material.dispose();
    scene.remove(this.mesh);

    if(this.arrow) {
      this.arrow.dispose();
      scene.remove(this.arrow);
    }
  };
}

export default PlayerDebugBox;