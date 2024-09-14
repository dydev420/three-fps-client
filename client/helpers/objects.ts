import { Vector3, Object3D, Box3 } from 'three';

export const vec3_4 = new Vector3()

export const _calculateObjectSize = (object: Object3D) => {
  const bbox = new Box3()
  bbox.expandByObject(object)
  const size = bbox.getSize(vec3_4)

  return size
}

