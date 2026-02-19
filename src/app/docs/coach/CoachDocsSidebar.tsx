"use client";

import { useEffect, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachDoc } from "@/lib/specs";

export function CoachDocsSidebar({ docs }: { docs: CoachDoc[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const ids = docs.map((d) => d.slug);

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
  }, [docs]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  }

  return (
    <nav aria-label="Coach guide navigation">
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
          Coach Guide
        </div>

        <ul className="space-y-0.5 text-sm">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <button
                onClick={() => handleClick(doc.slug)}
                className={cn(
                  "block w-full text-left rounded-md px-3 py-1.5 transition-colors",
                  activeId === doc.slug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
