export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private activeRequests: number;

  constructor(
    private maxConcurrent: number = 3,
    private maxPerSecond: number = 5,
  ) {
    this.tokens = maxPerSecond;
    this.lastRefill = Date.now();
    this.activeRequests = 0;
  }

  async acquire(): Promise<void> {
    // Wait until we have both a token and a concurrency slot
    while (true) {
      this.refill();
      if (this.tokens > 0 && this.activeRequests < this.maxConcurrent) {
        this.tokens--;
        this.activeRequests++;
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxPerSecond, this.tokens + elapsed * this.maxPerSecond);
    this.lastRefill = now;
  }
}
