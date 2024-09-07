// * Responsible for the Head Bob (up and down) movement of the character (only works in first-person-mode)
class HeadBobController {
  headBobTimer: number
  headBobAmount: number
  lastHeadBobDiff: number
  headBobActive: boolean

  constructor() {
    this.headBobTimer = 0
    this.lastHeadBobDiff = 0
    this.headBobAmount = 0
    this.headBobActive = false
  }

  getHeadBob(timeDiff: number, isMoving: boolean) {
    const HEAD_BOB_DURATION = 0.1
    const HEAD_BOB_FREQUENCY = 0.8
    const HEAD_BOB_AMPLITUDE = 0.3

    if (!this.headBobActive) {
      this.headBobActive = isMoving
    }

    if (this.headBobActive) {
      const STEP = Math.PI

      const currentAmount = this.headBobTimer * HEAD_BOB_FREQUENCY * (1 / HEAD_BOB_DURATION)
      const headBobDiff = currentAmount % STEP

      this.headBobTimer += timeDiff
      this.headBobAmount = Math.sin(currentAmount) * HEAD_BOB_AMPLITUDE

      if (headBobDiff < this.lastHeadBobDiff) {
        this.headBobActive = false
      }

      this.lastHeadBobDiff = headBobDiff
    }

    return this.headBobAmount
  }
}

export default HeadBobController;