import { Vector3 } from 'three';

// * helpers
export const HALF_PI = Math.PI / 2
export const FORWARD = new Vector3(0, 0, -1)
export const LEFT = new Vector3(-1, 0, 0)
export const UP = new Vector3(0, 1, 0)
export const RIGHT = new Vector3(1, 0, 0)
export const DOWN = new Vector3(0, -1, 0)

// * helper functions
export const ONE = () => {
  return 1
}

export const FIVE = () => {
  return 5
}

export const ZERO = () => {
  return 0
}
