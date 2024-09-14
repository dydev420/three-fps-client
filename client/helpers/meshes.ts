import { CapsuleGeometry, Mesh, MeshStandardMaterial } from 'three'
import { RAPIER, usePhysics, usePhysicsObjects, useScene, useTick } from '../render/init'
import { addPhysics } from '../render/physics/physics'

const _addCapsule = (
  height: number,
  radius: number,
  capSegments: number,
  radialSegments: number
) => {
  const scene = useScene()
  const geometry = new CapsuleGeometry(radius, height, capSegments, radialSegments)
  const material = new MeshStandardMaterial({ color: 0xd60019, transparent: true })
  const capsule = new Mesh(geometry, material)
  capsule.position.y += height / 2 + radius

  capsule.position.y += 10

  scene.add(capsule)

  return capsule
}

const _removeCapsule = (mesh : Mesh) => {
  const scene = useScene()
 
  // TODO: dispose other mesh components too
  mesh.geometry.dispose();

  scene.remove(mesh);
}

export { _addCapsule, _removeCapsule }
