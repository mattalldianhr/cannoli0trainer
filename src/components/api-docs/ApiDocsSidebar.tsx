"use client";

import { useEffect, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EndpointGroup } from "@/lib/api-docs-data";

export function ApiDocsSidebar({ groups }: { groups: EndpointGroup[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Track which section/endpoint is visible
  useEffect(() => {
    const ids = [
      "auth-overview",
      ...groups.flatMap((g) => [g.id, ...g.endpoints.map((e) => e.id)]),
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [groups]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  }

  // Is the active item within a given group?
  function isGroupActive(group: EndpointGroup) {
    return (
      activeId === group.id ||
      group.endpoints.some((e) => e.id === activeId)
    );
  }

  return (
    <nav aria-label="API reference navigation">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-card p-3 text-sm font-medium lg:hidden"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Jump to section
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Sidebar content */}
      <div className={cn("lg:block", isOpen ? "block mt-2" : "hidden")}>
        <div className="hidden lg:block text-sm font-semibold mb-3 text-foreground">
          API Reference
        </div>

        <ul className="space-y-0.5 text-sm">
          {/* Auth section */}
          <li>
            <button
              onClick={() => handleClick("auth-overview")}
              className={cn(
                "block w-full text-left rounded-md px-3 py-1.5 transition-colors font-medium",
                activeId === "auth-overview"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Authentication
            </button>
          </li>

          {/* Endpoint groups */}
          {groups.map((group) => (
            <li key={group.id}>
              <button
                onClick={() => handleClick(group.id)}
                className={cn(
                  "block w-full text-left rounded-md px-3 py-1.5 transition-colors font-medium",
                  isGroupActive(group) && activeId === group.id
                    ? "bg-primary/10 text-primary"
                    : isGroupActive(group)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {group.title}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {group.endpoints.length}
                </span>
              </button>

              {/* Endpoint links (indented) */}
              {isGroupActive(group) && (
                <ul className="ml-2 mt-0.5 space-y-0.5">
                  {group.endpoints.map((ep) => (
                    <li key={ep.id}>
                      <button
                        onClick={() => handleClick(ep.id)}
                        className={cn(
                          "block w-full text-left rounded-md pl-5 pr-3 py-1 text-xs transition-colors",
                          activeId === ep.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {ep.summary}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
