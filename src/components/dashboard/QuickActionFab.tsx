'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, X, ClipboardList, UserPlus, BarChart3 } from 'lucide-react';

const actions = [
  {
    label: 'New Program',
    href: '/programs/new',
    icon: ClipboardList,
    color: 'bg-primary text-primary-foreground',
  },
  {
    label: 'Add Athlete',
    href: '/athletes/new',
    icon: UserPlus,
    color: 'bg-blue-600 text-white',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    color: 'bg-emerald-600 text-white',
  },
];

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50 sm:hidden">
      {/* Action items */}
      {open && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-3 mb-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                onClick={() => setOpen(false)}
              >
                <span className="rounded-lg bg-background border shadow-lg px-3 py-2 text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
                <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-transform active:scale-95"
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
