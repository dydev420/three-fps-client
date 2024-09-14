class Ticker {
  timestamp: number;
  deltaTime: number;
  fps: number;
  deltaTimeCapped: number;

  constructor() {
    this.timestamp = performance.now();
    this.deltaTime = 0;
    this.fps = 0;
    this.deltaTimeCapped = 0;
  }

  update() {
    const now = performance.now()
    this.deltaTime = now - this.timestamp;
    this.timestamp = now;
    this.fps = 1000 / this.deltaTime;
    this.deltaTimeCapped = Math.min(Math.max(this.deltaTime, 0), 100);
  }
}

export default Ticker;
