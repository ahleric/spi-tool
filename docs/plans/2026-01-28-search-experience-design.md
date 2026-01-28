# Search Experience Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the homepage search experience with music-themed UI, local-only suggestions, and clearer loading/error states without increasing Spotify API calls.

**Architecture:** Add a lightweight suggestions API that reads only from local DB/event logs, plus client-side suggestion UX in the search form. Preserve the existing Spotify resolve flow for actual search submissions. UI changes are localized to the search form and a new suggest panel component, with Tailwind/CSS updates for visuals and accessibility.

**Tech Stack:** Next.js 14 (App Router), React, Tailwind CSS, Prisma/PostgreSQL.

---

### Task 1: Add suggestions API (DB-only, no Spotify calls)

**Files:**
- Create: `src/app/api/suggest/route.ts`
- Modify: `src/lib/services/catalog.ts`
- Modify: `src/lib/rate-limit.ts` (if helper needed)
- Test: `tests/api/suggest.test.ts` (or create `__tests__/api/suggest.test.ts` if tests framework exists)

**Step 1: Write the failing test**

```ts
// tests/api/suggest.test.ts
import { GET } from "@/app/api/suggest/route";

// pseudo-example; adapt to project test runner
```

**Step 2: Run test to verify it fails**

Run: `npm test` (or `npm run test` if available)
Expected: FAIL because route not found.

**Step 3: Write minimal implementation**

```ts
// src/app/api/suggest/route.ts
export const dynamic = "force-dynamic";

// GET?q=... -> { ok: true, suggestions: [...] }
// Suggestions come from: recent popular searches (EventLog) + Artist/Track name match
```

Add helper in `src/lib/services/catalog.ts`:

```ts
export async function suggestCatalog(query: string, limit = 6) {
  // DB-only; do not call Spotify
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/suggest/route.ts src/lib/services/catalog.ts tests/api/suggest.test.ts
git commit -m "feat: add local suggestions API"
```

---

### Task 2: Add suggestion UI and improved loading/error states

**Files:**
- Modify: `src/components/search/search-form.tsx`
- Create: `src/components/search/search-suggestions.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/i18n.ts` (or relevant translation file)

**Step 1: Write the failing test**

If no test framework, skip test and note manual verification. Otherwise create a simple render test for suggestions panel.

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL until UI implemented.

**Step 3: Write minimal implementation**

- Add suggestion panel component:
  - Shows "正在本地匹配" state while loading suggestions
  - Shows list of suggestions (name + type tag)
  - Shows empty state with sample terms
- Add debounced fetch to `/api/suggest` in `SearchForm`:
  - Only call after 2+ chars
  - Cancel previous fetch on new input
  - No Spotify calls
- Update error handling to show card-style message + guidance
- Keep existing input glow effect (do not modify `.input-glow-container`)

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/search/search-form.tsx src/components/search/search-suggestions.tsx src/app/globals.css src/lib/i18n.ts
git commit -m "feat: enhance search UX with suggestions and clearer feedback"
```

---

### Task 3: Music-themed visual polish (non-invasive)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Write the failing test**

Skip (visual-only). Note manual verification.

**Step 2: Implement minimal visual tweaks**

- Add subtle gradient/ambient background on homepage section
- Add small helper text under search input for guidance (localized)
- Ensure focus states and touch targets

**Step 3: Manual verification**

Open homepage and verify:
- Input glow effect preserved
- Suggestions open/close smoothly
- Error states readable

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css tailwind.config.ts
git commit -m "style: music-themed homepage polish"
```

---

### Task 4: Documentation + Smoke test

**Files:**
- Modify: `README.md`

**Step 1: Update README**

Add a short note: suggestions are local-only and do not call Spotify.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: clarify local-only search suggestions"
```

