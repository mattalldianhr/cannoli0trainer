import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/findings/StatCard";
import { apiEndpoints, extractionStats } from "@/lib/findings-data";

export default function FindingsApiPage() {
  return (
    <div className="space-y-8">
      {/* API Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Base URL" value="api.teambuildr.com" />
        <StatCard label="Auth" value="Bearer JWT" description="From accessToken cookie" />
        <StatCard label="Account" value={extractionStats.accountId} />
        <StatCard label="Endpoints Tested" value={apiEndpoints.length} />
      </div>

      {/* Three-Domain Architecture */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Three-Domain Architecture</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              domain: "app.teambuildr.com",
              purpose: "Legacy PHP App",
              description: "Server-rendered PHP application. Original TeamBuildr interface.",
              tech: "PHP",
            },
            {
              domain: "app-v3.teambuildr.com",
              purpose: "Modern SPA Frontend",
              description: "React single-page application. Current user-facing interface.",
              tech: "React SPA",
            },
            {
              domain: "api.teambuildr.com",
              purpose: "REST API Backend",
              description: "JSON REST API. All data operations go through this domain.",
              tech: "REST JSON",
            },
          ].map((d) => (
            <Card key={d.domain}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">{d.domain}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{d.tech}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-1">{d.purpose}</p>
                <p className="text-xs text-muted-foreground">{d.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Endpoint Catalog */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Endpoint Catalog</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Endpoint</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Parameters</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiEndpoints.map((endpoint) => (
                    <tr key={endpoint.path} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs font-mono">
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{endpoint.path}</td>
                      <td className="py-3 px-4">{endpoint.description}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{endpoint.params}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className="text-xs border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Tested
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Auth Details */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Mechanism</h3>
              <p className="text-sm text-muted-foreground">
                Bearer token JWT obtained from the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">accessToken</code> cookie
                after authenticating via app-v3.teambuildr.com. Token is 192 characters.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Header Format</h3>
              <div className="bg-muted rounded-md p-3 text-sm font-mono">
                Authorization: Bearer eyJ...
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-1">Token Lifetime</h3>
              <p className="text-sm text-muted-foreground">
                No observed expiration during multi-hour extraction sessions.
                Token appears to be long-lived session token.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pagination */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pagination Strategy</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Overview Endpoint</h3>
              <p className="text-sm text-muted-foreground">
                Max range of 120 days (returns 400 error above). The app itself uses
                70-day sliding windows. Our export uses 90-day windows for safety.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Strategy</h3>
              <p className="text-sm text-muted-foreground">
                Slide the overview window backward in 90-day chunks to cover full history.
                For each date with workout data, fetch the detail endpoint which has no range limit.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Rate Limiting</h3>
              <p className="text-sm text-muted-foreground">
                No rate limiting observed at 5 concurrent requests. Production export uses
                3 concurrent / 5 req/s as a conservative default.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
