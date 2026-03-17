# MockLoop — Session Log

> **Purpose:** Handoff document for resuming work in a fresh Claude session.
> Updated after every phase or significant code change.

---

## Last Updated: 2026-03-17 | After: Phase 2 Complete

### Current Status

| Item | Status |
|------|--------|
| **Current Phase** | Phase 2 complete → Starting Phase 3 (AI Analysis) |
| **Next Task** | Phase 3, Task 3.1: Create analysis prompt templates |
| **Dev Server** | Port 3001 (`npm run dev -- -p 3001`) |
| **GitHub Repo** | https://github.com/Umair-J/mockloop (private) |
| **Spec File** | `/Users/minahil/Downloads/mockapp.md` (source of truth) |

### What's Built & Working

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | Next.js 14 + TypeScript scaffold | ✅ |
| 1 | Prisma v7 schema (13 models, 7 enums) | ✅ |
| 1 | PostgreSQL local (Homebrew) + migrations | ✅ |
| 1 | NextAuth v5 Google OAuth (split config for Edge) | ✅ Code written |
| 1 | Role-based middleware (admin/user) | ✅ |
| 1 | Sidebar navigation + responsive layout | ✅ |
| 1 | Admin Members page (invite/manage) | ✅ |
| 2 | Google Drive polling service (`google-drive.ts`) | ✅ Code written |
| 2 | Sessions API — list, create, detail | ✅ |
| 2 | Transcript ingestion API (API key auth) | ✅ |
| 2 | Admin Recordings page | ✅ |
| 2 | Sessions list + detail pages | ✅ |
| 2 | TranscriptViewer component | ✅ |

### What's NOT Yet Configured

| Item | What's Needed |
|------|--------------|
| Google OAuth | Real `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `.env` |
| Google Drive | Service account JSON + folder ID in `.env` |
| Anthropic API | Key received from user — needs to be added to `.env` |
| Sign-in flow | Can't test until OAuth credentials are set |
| Task 2.6 | Python transcription script — skipped for now |

### Key Architecture Decisions (Deviations from Original Spec)

1. **Prisma v7** — Uses `prisma-client` generator (not `prisma-client-js`), requires `@prisma/adapter-pg` driver adapter, no `url` in datasource block (uses `prisma.config.ts` instead)
2. **NextAuth v5 Edge split** — `auth.config.ts` (lightweight, no Prisma) for middleware; `auth.ts` (full, with Prisma adapter) for server-side
3. **Import path** — `@/generated/prisma/client` (not `@/generated/prisma`)
4. **Comment API route** — Nested under `by-session/[sessionId]` to avoid route collision
5. **Filename convention** — Uses `-at-` instead of `@` in recording filenames
6. **Port** — Dev server on 3001 (3000 used by another project)

### Known Issues / Incomplete Items

- Phase 2 code written but not yet verified through dev server compilation
- `.gitkeep` files in empty route dirs (will be replaced as routes are built)
- Docker compose file exists but Docker not installed (using local PostgreSQL)

### Coding Practices

1. **Git + GitHub:** Commit and push after every code update
2. **Session Log:** Update this file after each phase/significant change
3. **Spec File:** `mockapp.md` is the source of truth — update it when deviations are found
4. **Verification:** Check dev server compilation after writing code

### File Tree (Key Files Only)

```
mockloop/
├── prisma/
│   └── schema.prisma          # 13 models, 7 enums
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── members/page.tsx
│   │   │   └── recordings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── sessions/route.ts
│   │   │   ├── sessions/[id]/route.ts
│   │   │   ├── transcripts/route.ts
│   │   │   └── users/route.ts + invite/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── sessions/page.tsx + [id]/page.tsx
│   │   ├── sign-in/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/Sidebar.tsx + NavItem.tsx
│   │   ├── sessions/TranscriptViewer.tsx
│   │   └── ui/Badge.tsx
│   ├── lib/
│   │   ├── auth.ts + auth.config.ts
│   │   ├── prisma.ts
│   │   └── google-drive.ts
│   ├── middleware.ts
│   └── types/next-auth.d.ts
├── .env.example
├── SESSION_LOG.md              # ← This file
└── package.json
```

### How to Resume

When starting a new session, say:

> "Read `/Users/minahil/Dev/mockloop/SESSION_LOG.md` and `/Users/minahil/Downloads/mockapp.md`. Resume building MockLoop from where we left off. I have no coding experience — explain options in simple terms."
