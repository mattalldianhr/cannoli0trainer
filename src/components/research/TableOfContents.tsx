"use client";

import { useEffect, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  }

  return (
    <nav aria-label="Table of contents">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-card p-3 text-sm font-medium lg:hidden"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Table of Contents
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {/* Heading list */}
      <div
        className={cn(
          "lg:block",
          isOpen ? "block mt-2" : "hidden"
        )}
      >
        <div className="hidden lg:block text-sm font-semibold mb-3 text-foreground">
          On this page
        </div>
        <ul className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "block w-full text-left rounded-md px-3 py-1.5 transition-colors",
                  heading.level === 3 && "pl-6",
                  activeId === heading.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
