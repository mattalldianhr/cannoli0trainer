# Project Commands

## Build
```bash
npm run build
```

## Dev Server
```bash
npm run dev
```

## Test
```bash
npm run test
```

## E2E Tests (Playwright)
```bash
npm run test:e2e
```

## Typecheck
```bash
npx tsc --noEmit
```

## Lint
```bash
npm run lint
```

## Prisma Validate
```bash
npx prisma validate
```

## Prisma Generate
```bash
npx prisma generate
```

## Prisma Migrate
```bash
npx prisma migrate dev --name <migration_name>
```

## Prisma Seed
```bash
npx prisma db seed
```

## Validate All
```bash
npx prisma validate && npx prisma generate && npx tsc --noEmit && npm run lint && npm run build
```

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9.3 (strict mode)
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4.1.18 + CVA + Radix UI
- **Database**: PostgreSQL via Prisma 5.22.0
- **Icons**: lucide-react
- **Path Alias**: `@/*` → `./src/*`

## Conventions
- PascalCase component files, camelCase utilities
- Server components by default, `'use client'` only for interactivity
- UI primitives in `components/ui/`, feature components in `components/{feature}/`
- Types in `lib/{feature}/types.ts`
- API routes follow REST patterns in `app/api/{resource}/route.ts`
- Use `cn()` from `@/lib/utils` for conditional class merging
- Prisma singleton from `@/lib/prisma`
