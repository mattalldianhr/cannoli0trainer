import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/lib/api-docs-data";

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  POST: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-bold font-mono tracking-wide",
        methodColors[method]
      )}
    >
      {method}
    </span>
  );
}
