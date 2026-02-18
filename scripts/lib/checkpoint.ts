import * as fs from "fs";
import * as path from "path";

export interface CheckpointData {
  accountId: number;
  startedAt: string;
  lastUpdated: string;
  athletes: Record<
    string,
    {
      userId: number;
      name: string;
      status: "pending" | "in_progress" | "completed";
      lastExportedDate: string | null;
      datesProcessed: number;
      totalDates: number;
      errors: number;
    }
  >;
}

export class CheckpointManager {
  private filePath: string;
  private data: CheckpointData;

  constructor(outputDir: string, accountId: number) {
    this.filePath = path.join(outputDir, "checkpoint.json");
    this.data = this.load(accountId);
  }

  private load(accountId: number): CheckpointData {
    if (fs.existsSync(this.filePath)) {
      return JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    }
    return {
      accountId,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      athletes: {},
    };
  }

  save(): void {
    this.data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getAthleteStatus(userId: number): CheckpointData["athletes"][string] | undefined {
    return this.data.athletes[String(userId)];
  }

  initAthlete(userId: number, name: string, totalDates: number): void {
    const existing = this.data.athletes[String(userId)];
    if (existing?.status === "completed") return;
    this.data.athletes[String(userId)] = {
      userId,
      name,
      status: "in_progress",
      lastExportedDate: existing?.lastExportedDate ?? null,
      datesProcessed: existing?.datesProcessed ?? 0,
      totalDates,
      errors: existing?.errors ?? 0,
    };
    this.save();
  }

  updateProgress(userId: number, date: string, datesProcessed: number): void {
    const athlete = this.data.athletes[String(userId)];
    if (!athlete) return;
    athlete.lastExportedDate = date;
    athlete.datesProcessed = datesProcessed;
    this.save();
  }

  recordError(userId: number): void {
    const athlete = this.data.athletes[String(userId)];
    if (!athlete) return;
    athlete.errors++;
    this.save();
  }

  completeAthlete(userId: number): void {
    const athlete = this.data.athletes[String(userId)];
    if (!athlete) return;
    athlete.status = "completed";
    this.save();
  }

  isAthleteCompleted(userId: number): boolean {
    return this.data.athletes[String(userId)]?.status === "completed";
  }

  getLastExportedDate(userId: number): string | null {
    return this.data.athletes[String(userId)]?.lastExportedDate ?? null;
  }

  getSummary(): { total: number; completed: number; inProgress: number; errors: number } {
    const athletes = Object.values(this.data.athletes);
    return {
      total: athletes.length,
      completed: athletes.filter((a) => a.status === "completed").length,
      inProgress: athletes.filter((a) => a.status === "in_progress").length,
      errors: athletes.reduce((sum, a) => sum + a.errors, 0),
    };
  }
}
