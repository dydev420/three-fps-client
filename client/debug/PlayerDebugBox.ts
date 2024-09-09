import * as THREE from 'three';
import DebugBox from "./interfaces/DebugBox";
import * as common from '../../server/common.mts';

class PlayerDebugBox implements DebugBox {
  selfUpdate: boolean;
  id: number;
  player: common.Player;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh;
  arrow: THREE.ArrowHelper | undefined;

  constructor(player: common.Player, id: number, selfUpdate: boolean = false) {
    this.selfUpdate = selfUpdate;
    this.player = player;
    this.id = id;

    // three js stuff
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(player.hue/360, 0.8, 0.5),
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  renderInScene(scene: THREE.Scene) {
    if(this.mesh) {
      scene.add(this.mesh);
    }
  }

  updateMesh(player: common.Player) {
    if(player) {
      const { position } = player;
      
      // Update position
      this.mesh.position.x = position.x;
      this.mesh.position.z = position.y;
    }
  }

  updateArrow(player: common.Player, scene: THREE.Scene) {
    if(this.arrow) {
      this.arrow.dispose();
      scene.remove(this.arrow);
    }

    if(player) {
      const forwardDir = common.vec3D(common.getForwardDir(player));
      const playerPosition = common.vec3D(player.position);
      const forwardVector = new THREE.Vector3(forwardDir.x, forwardDir.y, forwardDir.z);
      const origin = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z,
      );

      this.arrow = new THREE.ArrowHelper(forwardVector, origin, 3, 'purple')
      scene.add(this.arrow);
    }
  }
  
  update(scene: THREE.Scene, deltaTime: number): void {
    if(this.player) {
      // only call player physics update if selfUpdating
      // (use selfUpdating when there is no real network pawn controller in the scene)
      if(this.selfUpdate) {
        common.updatePlayer(this.player, deltaTime);
      }

      // update mesh immediately after updating player on engine
      // all other update methods can use 3d position of mesh
      this.updateMesh(this.player);
      
      // update other 3d objects
      this.updateArrow(this.player, scene);    
    }
  };
}

export default PlayerDebugBox;