"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { JsonExample } from "@/lib/api-docs-data";

export function CodeBlock({
  label,
  content,
}: {
  label: string;
  content: JsonExample;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(content, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
        {json}
      </pre>
    </div>
  );
}
