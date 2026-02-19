import { Card, CardContent } from "@/components/ui/card";
import { MethodBadge } from "./MethodBadge";
import { ParamTable } from "./ParamTable";
import { CodeBlock } from "./CodeBlock";
import { Lightbulb, AlertTriangle } from "lucide-react";
import type { Endpoint } from "@/lib/api-docs-data";

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const hasRequestBody =
    endpoint.requestExample &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method);

  return (
    <Card id={endpoint.id} className="scroll-mt-24">
      <CardContent className="p-6 space-y-4">
        {/* Header: method + path + summary */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-mono font-semibold">
              {endpoint.path}
            </code>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            {endpoint.summary}
          </p>
        </div>

        {/* Coach tip */}
        <div className="flex gap-2 rounded-md bg-accent p-3">
          <Lightbulb className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-accent-foreground">{endpoint.coachTip}</p>
        </div>

        {/* Parameters */}
        {endpoint.params.length > 0 && <ParamTable params={endpoint.params} />}

        {/* Request body */}
        {hasRequestBody && (
          <CodeBlock label="Request body" content={endpoint.requestExample!} />
        )}

        {/* Response */}
        <CodeBlock label="Response" content={endpoint.responseExample} />

        {/* Error codes */}
        {endpoint.errorCodes && endpoint.errorCodes.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {endpoint.errorCodes.map((err) => (
              <div
                key={err.code}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span className="font-mono font-medium">{err.code}</span>
                <span>{err.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
