# MockLoop — Session Log

> **Purpose:** Handoff document for resuming work in a fresh Claude session.
> Updated after every phase or significant code change.

---

## Last Updated: 2026-03-17 | After: Phase 3 Complete

### Current Status

| Item | Status |
|------|--------|
| **Current Phase** | Phase 3 complete → Starting Phase 4 (Interviewer Comments) |
| **Next Task** | Phase 4, Task 4.1: Build comments API routes |
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
| 3 | Analysis prompt template (`analysis-v1.ts`) — 6 dimensions with rubric anchors | ✅ |
| 3 | Claude SDK client (`claude.ts`) — exponential backoff, 3 retries | ✅ |
| 3 | Manual analysis trigger API (`POST /api/analysis/trigger`) — admin only | ✅ |
| 3 | Analysis retrieval API (`GET /api/analysis/[sessionId]`) | ✅ |
| 3 | ScoreCard + AnalysisPanel components — scores, strengths, weaknesses, recommendations | ✅ |
| 3 | Session Detail page updated with full AI analysis display | ✅ |

### What's NOT Yet Configured

| Item | What's Needed |
|------|--------------|
| Google OAuth | Real `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `.env` |
| Google Drive | Service account JSON + folder ID in `.env` |
| Anthropic API | ✅ Key saved to `.env` |
| Sign-in flow | Can't test until OAuth credentials are set |
| Task 2.6 | Python transcription script — skipped for now |

### Key Architecture Decisions (Deviations from Original Spec)

1. **Prisma v7** — Uses `prisma-client` generator (not `prisma-client-js`), requires `@prisma/adapter-pg` driver adapter, no `url` in datasource block (uses `prisma.config.ts` instead)
2. **NextAuth v5 Edge split** — `auth.config.ts` (lightweight, no Prisma) for middleware; `auth.ts` (full, with Prisma adapter) for server-side
3. **Import path** — `@/generated/prisma/client` (not `@/generated/prisma`)
4. **Comment API route** — Nested under `by-session/[sessionId]` to avoid route collision
5. **Filename convention** — Uses `-at-` instead of `@` in recording filenames
6. **Port** — Dev server on 3001 (3000 used by another project)
7. **Analysis trigger** — Manual only (no auto-trigger on transcript complete), per user preference
8. **Score display** — Both numeric (7.5/10) AND colored progress bars, per user preference

### Known Issues / Incomplete Items

- `.gitkeep` files in empty route dirs (will be replaced as routes are built)
- Docker compose file exists but Docker not installed (using local PostgreSQL)
- OAuth not configured yet — can't test authenticated flows end-to-end

### Coding Practices

1. **Git + GitHub:** Commit and push after every code update
2. **Session Log:** Update this file after each phase/significant change
3. **Spec File:** `mockapp.md` is the source of truth — update it when deviations are found
4. **Verification:** Check dev server compilation after writing code

### File Tree (Key Files Only)

```
mockloop/
├── prisma/
│   └── schema.prisma              # 13 models, 7 enums
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── members/page.tsx
│   │   │   └── recordings/page.tsx
│   │   ├── api/
│   │   │   ├── analysis/trigger/route.ts      # POST — manual trigger (admin)
│   │   │   ├── analysis/[sessionId]/route.ts  # GET — fetch analysis
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
│   │   ├── sessions/AnalysisPanel.tsx         # Full analysis display
│   │   ├── sessions/ScoreCard.tsx             # Score with progress bar
│   │   ├── sessions/TranscriptViewer.tsx
│   │   └── ui/Badge.tsx
│   ├── lib/
│   │   ├── auth.ts + auth.config.ts
│   │   ├── claude.ts                          # Anthropic SDK + retry
│   │   ├── prisma.ts
│   │   ├── google-drive.ts
│   │   └── prompts/analysis-v1.ts             # Versioned analysis prompt
│   ├── middleware.ts
│   └── types/next-auth.d.ts
├── .env.example
├── SESSION_LOG.md                  # ← This file
└── package.json
```

### How to Resume

When starting a new session, say:

> "Read `/Users/minahil/Dev/mockloop/SESSION_LOG.md` and `/Users/minahil/Downloads/mockapp.md`. Resume building MockLoop from where we left off. I have no coding experience — explain options in simple terms."
