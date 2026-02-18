"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitCompare,
  Server,
} from "lucide-react";

const navItems = [
  { href: "/findings", label: "Overview", icon: LayoutDashboard },
  { href: "/findings/athletes", label: "Athletes", icon: Users },
  { href: "/findings/schema", label: "Schema", icon: GitCompare },
  { href: "/findings/api", label: "API", icon: Server },
];

export function FindingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/findings"
            ? pathname === "/findings"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
