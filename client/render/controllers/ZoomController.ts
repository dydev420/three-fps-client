import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, SCROLL_ANIMATION_SPEED } from "./utils/constants"
import { clamp, easeOutExpo, lerp } from "./utils/math"

// * Responsible for the camera zoom on the character (first-person-mode and third-person-mode)
class ZoomController {
  zoom: number
  lastZoomLevel: number
  startZoomAnimation: number
  isAnimating: boolean
  startingZoom: number

  constructor() {
    this.zoom = MIN_ZOOM_LEVEL
    this.startingZoom = 0
    this.lastZoomLevel = 0
    this.startZoomAnimation = 0
    this.isAnimating = false
  }

  update(zoomLevel: number, timestamp: number, timeDiff: number) {
    const time = timestamp * SCROLL_ANIMATION_SPEED
    const zlClamped = clamp(zoomLevel, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL)

    const zoomLevelHasChanged = this.lastZoomLevel !== zoomLevel
    if (zoomLevelHasChanged) {
      // restart the animation
      this.startingZoom = this.zoom
      this.startZoomAnimation = time
      this.isAnimating = true
    }

    // animating
    if (this.isAnimating) {
      const progress = time - this.startZoomAnimation
      this.zoom = lerp(this.startingZoom, zlClamped, easeOutExpo(progress))

      if (progress >= 1) {
        // end the animation
        this.isAnimating = false
      }
    }

    this.lastZoomLevel = zoomLevel
  }
}

export default ZoomController;