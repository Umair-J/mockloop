# MockLoop — Session Log

> **Purpose:** Handoff document for resuming work in a fresh Claude session.
> Updated after every phase or significant code change.

---

## Last Updated: 2026-03-17 | After: Phase 4 Complete

### Current Status

| Item | Status |
|------|--------|
| **Current Phase** | Phase 4 complete → Starting Phase 5 (Scheduling) |
| **Next Task** | Phase 5, Task 5.1: Schedule config API |
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
| 4 | Comment CRUD API (POST, PUT, DELETE) with finalization lock | ✅ |
| 4 | Session-scoped comment list (GET) with visibility gating | ✅ |
| 4 | Finalization toggle (POST .../finalize) — reversible lock/unlock | ✅ |
| 4 | CommentForm component — category selector, timestamp, section label, edit mode | ✅ |
| 4 | CommentsSection component — full management with finalize/un-finalize | ✅ |
| 4 | Unified Feedback Report page (`/sessions/[id]/feedback`) — merged AI + human | ✅ |

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
9. **Finalization** — Reversible toggle (interviewer can un-finalize to edit, then re-finalize)

### Known Issues / Incomplete Items

- OAuth not configured yet — can't test authenticated flows end-to-end
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
│   └── schema.prisma              # 13 models, 7 enums
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── members/page.tsx
│   │   │   └── recordings/page.tsx
│   │   ├── api/
│   │   │   ├── analysis/trigger/route.ts
│   │   │   ├── analysis/[sessionId]/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── comments/route.ts              # POST create
│   │   │   ├── comments/[id]/route.ts         # PUT, DELETE
│   │   │   ├── comments/by-session/[sessionId]/route.ts     # GET list
│   │   │   ├── comments/by-session/[sessionId]/finalize/    # POST toggle
│   │   │   ├── sessions/route.ts
│   │   │   ├── sessions/[id]/route.ts
│   │   │   ├── transcripts/route.ts
│   │   │   └── users/route.ts + invite/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── sessions/page.tsx
│   │   ├── sessions/[id]/page.tsx             # Session detail (transcript + analysis + comments)
│   │   ├── sessions/[id]/feedback/page.tsx    # Unified feedback report
│   │   ├── sign-in/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/Sidebar.tsx + NavItem.tsx
│   │   ├── sessions/AnalysisPanel.tsx
│   │   ├── sessions/CommentForm.tsx
│   │   ├── sessions/CommentsSection.tsx
│   │   ├── sessions/ScoreCard.tsx
│   │   ├── sessions/TranscriptViewer.tsx
│   │   └── ui/Badge.tsx
│   ├── lib/
│   │   ├── auth.ts + auth.config.ts
│   │   ├── claude.ts
│   │   ├── prisma.ts
│   │   ├── google-drive.ts
│   │   └── prompts/analysis-v1.ts
│   ├── middleware.ts
│   └── types/next-auth.d.ts
├── .env.example
├── SESSION_LOG.md
└── package.json
```

### How to Resume

When starting a new session, say:

> "Read `/Users/minahil/Dev/mockloop/SESSION_LOG.md` and `/Users/minahil/Downloads/mockapp.md`. Resume building MockLoop from where we left off. I have no coding experience — explain options in simple terms."
