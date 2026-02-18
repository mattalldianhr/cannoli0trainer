export class Logger {
  private startTime: number;
  private apiCalls: number = 0;
  private errors: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  incrementApiCalls(): void {
    this.apiCalls++;
  }

  incrementErrors(): void {
    this.errors++;
  }

  getApiCalls(): number {
    return this.apiCalls;
  }

  getErrors(): number {
    return this.errors;
  }

  log(message: string): void {
    const elapsed = this.formatDuration(Date.now() - this.startTime);
    console.log(`[${elapsed}] ${message}`);
  }

  progress(athlete: string, current: number, total: number): void {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    const bar = this.progressBar(pct);
    const eta = this.estimateETA(current, total);
    process.stdout.write(`\r  ${athlete}: ${bar} ${pct}% (${current}/${total}) ETA: ${eta}   `);
  }

  progressDone(athlete: string, total: number): void {
    const bar = this.progressBar(100);
    process.stdout.write(`\r  ${athlete}: ${bar} 100% (${total}/${total}) Done\n`);
  }

  summary(): void {
    const elapsed = this.formatDuration(Date.now() - this.startTime);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Export complete`);
    console.log(`  Duration: ${elapsed}`);
    console.log(`  API calls: ${this.apiCalls}`);
    console.log(`  Errors: ${this.errors}`);
    console.log(`${"=".repeat(60)}`);
  }

  private progressBar(pct: number): string {
    const width = 30;
    const filled = Math.round((pct / 100) * width);
    return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "]";
  }

  private estimateETA(current: number, total: number): string {
    if (current === 0) return "--:--";
    const elapsed = Date.now() - this.startTime;
    const rate = current / elapsed;
    const remaining = (total - current) / rate;
    return this.formatDuration(remaining);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h${String(minutes % 60).padStart(2, "0")}m`;
    }
    return `${minutes}m${String(seconds % 60).padStart(2, "0")}s`;
  }
}
