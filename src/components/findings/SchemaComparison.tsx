import { Badge } from "@/components/ui/badge";

interface SchemaGap {
  id: number;
  gap: string;
  spec: string;
  teambuildrField: string;
  recommendation: string;
  priority: "Critical" | "High" | "Medium" | "Low";
}

interface SchemaComparisonProps {
  gaps: SchemaGap[];
}

const priorityColors: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export function SchemaComparison({ gaps }: SchemaComparisonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gap</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Spec</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">TeamBuildr Field</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Recommendation</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap) => (
            <tr key={gap.id} className="border-b border-border/50 hover:bg-muted/50">
              <td className="py-3 px-4 font-mono text-muted-foreground">{gap.id}</td>
              <td className="py-3 px-4 font-medium">{gap.gap}</td>
              <td className="py-3 px-4">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{gap.spec}</code>
              </td>
              <td className="py-3 px-4 text-muted-foreground">{gap.teambuildrField}</td>
              <td className="py-3 px-4">{gap.recommendation}</td>
              <td className="py-3 px-4">
                <Badge
                  className={`text-xs border-0 ${priorityColors[gap.priority] ?? ""}`}
                >
                  {gap.priority}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
