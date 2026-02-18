import { RateLimiter } from "./rate-limiter";
import { withRetry, RetryableError } from "./retry";

export interface TeamBuildrClientOptions {
  token: string;
  accountId: number;
  concurrency?: number;
  ratePerSecond?: number;
}

export interface Athlete {
  id: number;
  first: string;
  last: string;
  email: string;
}

export interface WorkoutOverviewDay {
  date: string;
  actionableItems: number;
  completedItems: number;
  completionPercentage: number | null;
  statusDescription: string;
  title: string | null;
  totalItems: number;
}

export class TeamBuildrClient {
  private baseUrl = "https://api.teambuildr.com";
  private token: string;
  private accountId: number;
  private rateLimiter: RateLimiter;

  constructor(options: TeamBuildrClientOptions) {
    this.token = options.token;
    this.accountId = options.accountId;
    this.rateLimiter = new RateLimiter(
      options.concurrency ?? 3,
      options.ratePerSecond ?? 5,
    );
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.request(`/accounts/${this.accountId}/users?userType=0`);
      return Array.isArray(response);
    } catch {
      return false;
    }
  }

  async getAthletes(): Promise<Athlete[]> {
    const users = await this.request(`/accounts/${this.accountId}/users?userType=0`);
    return users.map((u: Record<string, unknown>) => ({
      id: u.id as number,
      first: u.first as string,
      last: u.last as string,
      email: (u.email as string) || "",
    }));
  }

  async getWorkoutOverview(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<WorkoutOverviewDay[]> {
    return this.request(
      `/accounts/${this.accountId}/users/${userId}/workouts/overview?dateRangeStart=${startDate}&dateRangeEnd=${endDate}`,
    );
  }

  async getWorkoutDetail(userId: number, date: string): Promise<unknown> {
    return this.request(
      `/accounts/${this.accountId}/users/${userId}/workouts/${date}`,
    );
  }

  private async request(path: string): Promise<any> {
    await this.rateLimiter.acquire();
    try {
      return await withRetry(async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          headers: {
            Authorization: this.token.startsWith("Bearer ") ? this.token : `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 429 || response.status >= 500) {
          throw new RetryableError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} for ${path}`);
        }

        return response.json();
      });
    } finally {
      this.rateLimiter.release();
    }
  }
}
