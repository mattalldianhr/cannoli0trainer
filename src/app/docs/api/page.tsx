import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EndpointGroup } from "@/components/api-docs/EndpointGroup";
import { ApiDocsSidebar } from "@/components/api-docs/ApiDocsSidebar";
import { apiGroups, totalEndpoints } from "@/lib/api-docs-data";
import { Server, Shield, Zap } from "lucide-react";

export const metadata = {
  title: "API Reference | Cannoli Trainer",
  description:
    "Complete API reference for the Cannoli Trainer coaching platform. 45 endpoints across 12 groups with examples and coach tips.",
};

export default function ApiReferencePage() {
  return (
    <Container className="py-12">
      {/* Hero */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          API Reference
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cannoli Trainer API
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          {totalEndpoints} endpoints across {apiGroups.length} groups. Every
          endpoint includes parameters, examples, and plain-English coaching
          tips.
        </p>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden mb-6">
        <ApiDocsSidebar groups={apiGroups} />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-12">
          {/* Auth overview card */}
          <Card id="auth-overview" className="scroll-mt-24">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Authentication</h2>
                  <p className="text-sm text-muted-foreground">
                    How to authenticate with the API
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm mb-1">Base URL</h3>
                  <code className="bg-muted rounded-md px-3 py-1.5 text-sm font-mono block">
                    https://cannoli.mattalldian.com/api
                  </code>
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">Authentication</h3>
                  <code className="bg-muted rounded-md px-3 py-1.5 text-sm font-mono block">
                    Cookie: authjs.session-token=&lt;session-token&gt;
                  </code>
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">How it works</h3>
                  <p className="text-sm text-muted-foreground">
                    All requests require a valid session cookie. Sign in through
                    the app to get your session cookie, which is sent
                    automatically by the browser. Coach routes return{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      403 Forbidden
                    </code>{" "}
                    for athlete sessions. Athlete routes (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      /api/athlete/*
                    </code>
                    ) use the session to identify the athlete automatically. The
                    API returns{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      401 Unauthorized
                    </code>{" "}
                    if the session is missing or expired.
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">{totalEndpoints}</p>
                    <p className="text-xs text-muted-foreground">Endpoints</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">{apiGroups.length}</p>
                    <p className="text-xs text-muted-foreground">Groups</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">JSON</p>
                    <p className="text-xs text-muted-foreground">Format</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint groups */}
          {apiGroups.map((group) => (
            <EndpointGroup key={group.id} group={group} />
          ))}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <ApiDocsSidebar groups={apiGroups} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
