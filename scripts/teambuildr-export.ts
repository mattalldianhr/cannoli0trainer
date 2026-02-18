import * as fs from "fs";
import * as path from "path";
import { TeamBuildrClient } from "./lib/teambuildr-client";
import { CheckpointManager } from "./lib/checkpoint";
import { Logger } from "./lib/logger";

interface CLIOptions {
  token: string;
  account: number;
  output: string;
  resume: boolean;
  athletes: number[] | null;
  concurrency: number;
  rate: number;
}

function printUsage(): void {
  console.log(`
TeamBuildr Data Export Tool
===========================

Extracts complete workout history from a TeamBuildr account.

Usage:
  npx tsx scripts/teambuildr-export.ts [options]

Required:
  --token <token>       Bearer token (from accessToken cookie)
  --account <id>        TeamBuildr account ID
  --output <dir>        Output directory for exported data

Optional:
  --resume              Resume from last checkpoint
  --athletes <ids>      Comma-separated athlete IDs to export (default: all)
  --concurrency <n>     Max concurrent requests (default: 3)
  --rate <n>            Max requests per second (default: 5)
  --help                Show this help message

Examples:
  # Full export
  npx tsx scripts/teambuildr-export.ts \\
    --token "Bearer eyJ..." \\
    --account 20731 \\
    --output ./exports/2026-02-17

  # Resume interrupted export
  npx tsx scripts/teambuildr-export.ts \\
    --token "Bearer eyJ..." \\
    --account 20731 \\
    --output ./exports/2026-02-17 \\
    --resume

  # Export specific athletes
  npx tsx scripts/teambuildr-export.ts \\
    --token "Bearer eyJ..." \\
    --account 20731 \\
    --output ./exports/2026-02-17 \\
    --athletes 3534583,3534582

  # Conservative mode
  npx tsx scripts/teambuildr-export.ts \\
    --token "Bearer eyJ..." \\
    --account 20731 \\
    --output ./exports/2026-02-17 \\
    --concurrency 1 \\
    --rate 2
`);
}

function parseArgs(argv: string[]): CLIOptions | null {
  const args = argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printUsage();
    return null;
  }

  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const token = get("--token");
  const account = get("--account");
  const output = get("--output");

  if (!token || !account || !output) {
    console.error("Error: --token, --account, and --output are required.");
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  return {
    token,
    account: parseInt(account, 10),
    output,
    resume: args.includes("--resume"),
    athletes: get("--athletes")
      ? get("--athletes")!.split(",").map((id) => parseInt(id.trim(), 10))
      : null,
    concurrency: parseInt(get("--concurrency") ?? "3", 10),
    rate: parseInt(get("--rate") ?? "5", 10),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDateWindows(
  startDate: string,
  endDate: string,
  windowDays: number = 90,
): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];
  let current = new Date(endDate);
  const earliest = new Date(startDate);

  while (current >= earliest) {
    const windowStart = new Date(current);
    windowStart.setDate(windowStart.getDate() - windowDays + 1);
    if (windowStart < earliest) {
      windowStart.setTime(earliest.getTime());
    }

    windows.push({
      start: formatDate(windowStart),
      end: formatDate(current),
    });

    current = new Date(windowStart);
    current.setDate(current.getDate() - 1);
  }

  return windows;
}

async function exportAthlete(
  client: TeamBuildrClient,
  athlete: { id: number; first: string; last: string },
  outputDir: string,
  checkpoint: CheckpointManager,
  logger: Logger,
  resume: boolean,
): Promise<void> {
  const athleteName = `${athlete.first} ${athlete.last}`;
  const athleteDir = path.join(outputDir, `athlete-${athlete.id}`);

  if (!fs.existsSync(athleteDir)) {
    fs.mkdirSync(athleteDir, { recursive: true });
  }

  // Get date range to export
  const endDate = formatDate(new Date());
  const startDate = resume
    ? checkpoint.getLastExportedDate(athlete.id) ?? "2020-01-01"
    : "2020-01-01";

  logger.log(`${athleteName} (${athlete.id}): Scanning ${startDate} to ${endDate}`);

  // Collect all dates with workouts via overview windows
  const windows = getDateWindows(startDate, endDate);
  const workoutDates: string[] = [];

  for (const window of windows) {
    try {
      const overview = await client.getWorkoutOverview(athlete.id, window.start, window.end);
      logger.incrementApiCalls();

      for (const day of overview) {
        if (day.statusDescription !== "NO_WORKOUT" && day.totalItems > 0) {
          workoutDates.push(day.date);
        }
      }
    } catch (error) {
      logger.incrementErrors();
      checkpoint.recordError(athlete.id);
      logger.log(`  Warning: Failed to get overview for ${window.start} to ${window.end}: ${(error as Error).message}`);
    }
  }

  // Sort dates chronologically
  workoutDates.sort();

  // Filter out already-exported dates if resuming
  const lastExported = checkpoint.getLastExportedDate(athlete.id);
  const datesToExport = resume && lastExported
    ? workoutDates.filter((d) => d > lastExported)
    : workoutDates;

  logger.log(`${athleteName}: ${datesToExport.length} dates to export (${workoutDates.length} total workout dates)`);
  checkpoint.initAthlete(athlete.id, athleteName, datesToExport.length);

  // Export each date
  const allWorkouts: Record<string, unknown> = {};

  // Load existing data if resuming
  const dataFile = path.join(athleteDir, "workouts.json");
  if (resume && fs.existsSync(dataFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
      Object.assign(allWorkouts, existing);
    } catch {
      // Corrupted file, start fresh
    }
  }

  for (let i = 0; i < datesToExport.length; i++) {
    const date = datesToExport[i];
    try {
      const detail = await client.getWorkoutDetail(athlete.id, date);
      logger.incrementApiCalls();
      allWorkouts[date] = detail;

      // Save incrementally every 50 dates
      if ((i + 1) % 50 === 0 || i === datesToExport.length - 1) {
        fs.writeFileSync(dataFile, JSON.stringify(allWorkouts, null, 2));
      }

      checkpoint.updateProgress(athlete.id, date, i + 1);
      logger.progress(athleteName, i + 1, datesToExport.length);
    } catch (error) {
      logger.incrementErrors();
      checkpoint.recordError(athlete.id);
      logger.log(`\n  Warning: Failed to get workout for ${date}: ${(error as Error).message}`);
    }
  }

  // Final save
  fs.writeFileSync(dataFile, JSON.stringify(allWorkouts, null, 2));

  // Save athlete metadata
  fs.writeFileSync(
    path.join(athleteDir, "meta.json"),
    JSON.stringify(
      {
        id: athlete.id,
        name: athleteName,
        totalWorkoutDates: workoutDates.length,
        exportedDates: Object.keys(allWorkouts).length,
        dateRange: {
          earliest: workoutDates[0] ?? null,
          latest: workoutDates[workoutDates.length - 1] ?? null,
        },
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  checkpoint.completeAthlete(athlete.id);
  logger.progressDone(athleteName, datesToExport.length);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  if (!options) {
    process.exit(0);
  }

  const logger = new Logger();

  logger.log("TeamBuildr Data Export");
  logger.log(`Account: ${options.account}`);
  logger.log(`Output: ${options.output}`);
  logger.log(`Concurrency: ${options.concurrency}, Rate: ${options.rate}/s`);
  if (options.resume) logger.log("Resume mode: ON");
  if (options.athletes) logger.log(`Athletes filter: ${options.athletes.join(", ")}`);

  // Create output directory
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  // Initialize client
  const client = new TeamBuildrClient({
    token: options.token,
    accountId: options.account,
    concurrency: options.concurrency,
    ratePerSecond: options.rate,
  });

  // Validate connection
  logger.log("Validating connection...");
  const valid = await client.validateConnection();
  if (!valid) {
    console.error("Error: Failed to connect to TeamBuildr API. Check your token and account ID.");
    process.exit(1);
  }
  logger.log("Connection validated.");

  // Initialize checkpoint
  const checkpoint = new CheckpointManager(options.output, options.account);

  // Get athletes
  logger.log("Fetching athlete list...");
  logger.incrementApiCalls();
  let athletes = await client.getAthletes();

  if (options.athletes) {
    athletes = athletes.filter((a) => options.athletes!.includes(a.id));
  }

  logger.log(`Found ${athletes.length} athlete(s) to export`);

  // Export each athlete sequentially (rate limiter handles concurrency within each athlete)
  for (const athlete of athletes) {
    if (options.resume && checkpoint.isAthleteCompleted(athlete.id)) {
      logger.log(`Skipping ${athlete.first} ${athlete.last} (already completed)`);
      continue;
    }

    await exportAthlete(client, athlete, options.output, checkpoint, logger, options.resume);
  }

  // Summary
  logger.summary();

  const summary = checkpoint.getSummary();
  console.log(`  Athletes: ${summary.completed}/${summary.total} completed`);
  if (summary.errors > 0) {
    console.log(`  Total errors: ${summary.errors}`);
  }
  console.log(`  Output: ${options.output}`);
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
