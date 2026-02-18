export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRetryable = error instanceof RetryableError;
      if (!isRetryable || attempt === opts.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelayMs,
      );
      console.warn(`  Retry ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms: ${(error as Error).message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Unreachable");
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}
