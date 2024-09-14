import { BoxGeometry, CapsuleGeometry, Color, DoubleSide, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, Scene, Vector3 } from 'three'
import { RAPIER, usePhysics, usePhysicsObjects, useScene, useTick } from '../render/init'
import { addPhysics } from '../render/physics/physics'

export const _addCapsule = (
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

export const _removeCapsule = (mesh : Mesh) => {
  const scene = useScene()
 
  // TODO: dispose other mesh components too
  mesh.geometry.dispose();

  scene.remove(mesh);
}

export const getGroundMesh = (): Mesh => {
  // * Settings
  const planeWidth = 100
  const planeHeight = 100

  // * Mesh
  const geometry = new PlaneGeometry(planeWidth, planeHeight)
  const material = new MeshPhysicalMaterial({
    color: '#333',
    side: DoubleSide,
    // wireframe: true,
  })
  const plane = new Mesh(geometry, material);
  plane.position.y -= 1.5;
  plane.rotation.x -= Math.PI / 2;

  return plane;
}

export const getCubeMesh = (pos: Vector3, size: number = 1) => {

  // * Mesh
  const geometry = new BoxGeometry(size, size, size);
  const material = new MeshPhysicalMaterial({
    color: new Color().setHex(Math.min(Math.random() + 0.15, 1) * 0xffffff),
    side: DoubleSide,
  });
  const cube = new Mesh(geometry, material);

  cube.position.copy(pos);
  cube.position.y += 2;

  // * Add the mesh to the scene
  return cube;
}