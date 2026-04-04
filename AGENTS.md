# VanuWay — Agent Instructions

## Project Context

VanuWay is a Vanuatu super-app monorepo with two deployable apps (marketing website + mobile-first super-app) and a shared package. See CLAUDE.md for full project details.

## Agent Guidelines

### Before Starting Work
1. Read `CLAUDE.md` for project context
2. Check `memory/todo.md` for pending tasks
3. Check `memory/decisions.md` for prior architectural decisions

### Code Standards
- **TypeScript strict** — No `any`, use proper interfaces from `src/types/`
- **Tailwind only** — No inline styles, CSS modules, or styled-components
- **shadcn/ui** — Use existing components from `src/components/ui/`
- **React Router 6** — All routes defined in `src/App.tsx`
- **Supabase client** — Import from `@/integrations/supabase/client`
- **Lazy loading** — All page components must be lazy-loaded in App.tsx
- **Protected routes** — Wrap authenticated pages in `<ProtectedRoute>`
- **Admin routes** — Wrap admin pages in `<AdminRoute>`

### File Organization
```
apps/app/src/
├── pages/{domain}/       # Page components (one per route)
├── components/{domain}/  # Domain-specific components
├── components/ui/        # shadcn/ui base components
├── lib/{domain}/         # Business logic and services
├── types/                # TypeScript interfaces
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
└── integrations/supabase/ # Supabase client and auto-generated types
```

### Adding a New Feature
1. Define types in `src/types/{domain}.ts`
2. Create service functions in `src/lib/{domain}/`
3. Build page components in `src/pages/{domain}/`
4. Build reusable components in `src/components/{domain}/`
5. Add routes to `src/App.tsx` (lazy-loaded, wrapped in ProtectedRoute)
6. If new DB tables needed, create migration in `supabase/migrations/`

### Database
- Supabase types are auto-generated in `src/integrations/supabase/types.ts`
- All tables must have RLS policies
- Use Supabase client for all DB operations
- Edge Functions go in `supabase/functions/{function-name}/index.ts`

### Testing & Building
```bash
pnpm build          # Must pass before any PR/deploy
pnpm dev:app        # Test super-app locally
pnpm dev:website    # Test website locally
```

### After Completing Work
1. Update `memory/changelog.md` with changes made
2. Update `memory/decisions.md` if architectural decisions were made
3. Update `memory/todo.md` — mark completed items, add new discoveries
4. Run `pnpm build` to verify no regressions
