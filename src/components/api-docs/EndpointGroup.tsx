import { EndpointCard } from "./EndpointCard";
import type { EndpointGroup as EndpointGroupType } from "@/lib/api-docs-data";

export function EndpointGroup({ group }: { group: EndpointGroupType }) {
  return (
    <section id={group.id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{group.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {group.description}
        </p>
      </div>
      <div className="space-y-4">
        {group.endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>
    </section>
  );
}
