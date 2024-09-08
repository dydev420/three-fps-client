import * as THREE from 'three';
import Rapier, { RayColliderHit } from '@dimforge/rapier3d';
import { RAPIER, usePhysics, useRenderSize, useScene } from '../init'
import { useRenderer } from '../init'
import { PhysicsObject, addPhysics } from '../physics/physics'
import { GRAVITY } from '../physics/utils/constants'
import { _calculateObjectSize } from './utils/objects'
import { clamp, lerp, easeOutExpo, EaseOutCirc, UpDownCirc } from './utils/math'
import AvatarController from './AvatarController';
import InputManager, { KEYS } from './InputManager';
import ZoomController from './ZoomController';
import { DOWN, FIVE, FORWARD, HALF_PI, LEFT, ONE, RIGHT, UP, ZERO } from './utils/helpers';
import { Vector2 } from '../../../server/lib/vector.mts';


// * local variables
const quaternion_0 = new THREE.Quaternion()
const quaternion_1 = new THREE.Quaternion()
const vec3_0 = new THREE.Vector3()
const vec3_1 = new THREE.Vector3()
let ray_0: Rapier.Ray

// * Responsible for controlling the character movement, rotation and physics
class SimpleCharacterController extends THREE.Mesh {
  camera: THREE.PerspectiveCamera
  inputManager: InputManager
  phi: number
  theta: number
  objects: any
  isMoving2D: boolean
  startZoomAnimation: number
  zoomController: ZoomController
  physicsObject: PhysicsObject
  avatar: AvatarController
  networkPosition: Vector2

  constructor(avatar: AvatarController, camera: THREE.PerspectiveCamera) {
    super();

    // init position
    this.position.copy(avatar.avatar.position)
    
    // maybe get it from server on createGame?
    this.networkPosition = new Vector2(avatar.avatar.position.x, avatar.avatar.position.y);

    this.camera = camera;
    this.avatar = avatar;

    this.inputManager = new InputManager()
    this.zoomController = new ZoomController()

    // physics
    this.physicsObject = this.initPhysics(avatar)

    this.startZoomAnimation = 0

    this.phi = 0
    this.theta = 0

    this.isMoving2D = false
  }

  update(timestamp: number, deltaTime: number) {
    this.updateRotation()
    this.updateTranslation(deltaTime)
    this.updateZoom(timestamp, deltaTime)
    this.updateCamera(timestamp, deltaTime)
    this.inputManager.update()
  }

  initPhysics(avatar: AvatarController) {
    // initialize ray
    ray_0 = new RAPIER.Ray(vec3_0, vec3_0)

    // physics object
    const radius = avatar.width / 2
    const halfHeight = avatar.height / 2 - radius
    const physicsObject = addPhysics(this, 'kinematicPositionBased', false, undefined, 'capsule', {
      halfHeight,
      radius,
    })

    return physicsObject
  }


  updateZoom(timestamp: number, deltaTime: number) {
    this.zoomController.update(
      this.inputManager.currentMouse.mouseWheelDelta,
      timestamp,
      deltaTime
    )
  }

  updateCamera(timestamp: number, deltaTime: number) {
    this.camera.position.copy(this.position)
    // this.camera.position.y += this.avatar.height / 2

    // moving by the camera angle
    const circleRadius = this.zoomController.zoom
    const cameraOffset = vec3_0.set(
      circleRadius * Math.cos(-this.phi),
      circleRadius * Math.cos(this.theta + HALF_PI),
      circleRadius * Math.sin(-this.phi)
    )
    this.camera.position.add(cameraOffset)
    this.camera.lookAt(this.position)

    const isFirstPerson = this.zoomController.zoom <= this.avatar.width
    if (isFirstPerson) {

      // keep looking at the same position in the object in front
      const physics = usePhysics()

      const rayOrigin = vec3_1.copy(this.camera.position)
      const rayDirection = vec3_0.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize()
      const ray = ray_0
      ray.origin = rayOrigin
      ray.dir = rayDirection

      const hit: RayColliderHit | null = physics.castRay(ray, 1000, false)

      if (hit) {
        const point = ray.pointAt(hit.timeOfImpact)
        const hitPoint = vec3_0.set(point.x, point.y, point.z)
        this.camera.lookAt(hitPoint)
      }
    }
  }

  updateTranslation(deltaTime: number) {
    const deltaTime_d10 = deltaTime * 10

    const shiftSpeedUpAction = () =>
      this.inputManager.runActionByOneKey([KEYS.shiftL, KEYS.shiftR], FIVE, ONE)

    const forwardVelocity =
      this.inputManager.runActionByKey(KEYS.w, shiftSpeedUpAction, ZERO) -
      this.inputManager.runActionByKey(KEYS.s, shiftSpeedUpAction, ZERO)

    const sideVelocity =
      this.inputManager.runActionByKey(KEYS.a, shiftSpeedUpAction, ZERO) -
      this.inputManager.runActionByKey(KEYS.d, shiftSpeedUpAction, ZERO)

    const qx = quaternion_1
    qx.setFromAxisAngle(UP, this.phi + HALF_PI)

    vec3_0.copy(FORWARD)
    vec3_0.applyQuaternion(qx)
    vec3_0.multiplyScalar(forwardVelocity * deltaTime_d10)

    vec3_1.copy(LEFT)
    vec3_1.applyQuaternion(qx)
    vec3_1.multiplyScalar(sideVelocity * deltaTime_d10)

    this.position.add(vec3_0)
    this.position.add(vec3_1)

    this.isMoving2D = forwardVelocity != 0 || sideVelocity != 0
  }

  updateRotation() {
    const windowSize = useRenderSize()
    const xh = this.inputManager.currentMouse.mouseXDelta / windowSize.width
    const yh = this.inputManager.currentMouse.mouseYDelta / windowSize.height

    const PHI_SPEED = 2.5
    const THETA_SPEED = 2.5
    this.phi += -xh * PHI_SPEED
    this.theta = clamp(this.theta + -yh * THETA_SPEED, -Math.PI / 2, Math.PI / 2)

    const qx = quaternion_0
    qx.setFromAxisAngle(UP, this.phi)
    const qz = quaternion_1
    qz.setFromAxisAngle(RIGHT, this.theta)

    const q = qx.multiply(qz)

    this.quaternion.copy(q)
  }

  
}

export default SimpleCharacterController;
