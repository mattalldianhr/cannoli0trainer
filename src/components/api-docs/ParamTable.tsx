import { Badge } from "@/components/ui/badge";
import type { Param } from "@/lib/api-docs-data";

const locationColors: Record<string, string> = {
  path: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0",
  query: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0",
  body: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0",
};

export function ParamTable({ params }: { params: Param[] }) {
  if (params.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">
              Name
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">
              In
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">
              Type
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">
              Required
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr
              key={param.name}
              className="border-b border-border/50 hover:bg-muted/50"
            >
              <td className="py-2 px-3 font-mono text-xs">{param.name}</td>
              <td className="py-2 px-3">
                <Badge
                  className={`text-[10px] ${locationColors[param.location]}`}
                >
                  {param.location}
                </Badge>
              </td>
              <td className="py-2 px-3 text-muted-foreground text-xs font-mono">
                {param.type}
              </td>
              <td className="py-2 px-3">
                {param.required ? (
                  <span className="text-xs font-medium text-foreground">
                    Yes
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No</span>
                )}
              </td>
              <td className="py-2 px-3 text-xs text-muted-foreground">
                {param.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
