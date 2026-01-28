# Performance Cache Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add lightweight in-memory caching for artist/track API responses and search suggestions to reduce repeated DB/Spotify work without changing user-visible behavior.

**Architecture:** Introduce a small server-side memory cache utility with TTL. Apply it at the API route boundary (`/api/artist/[id]`, `/api/track/[id]`, `/api/suggest`) using cache keys that include route params and query strings. Keep TTLs short (30–120s) so data stays fresh and behavior unchanged.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, Node runtime.

---

### Task 1: Add a minimal memory cache utility

**Files:**
- Create: `src/lib/memory-cache.ts`
- Test: (none; project has no test runner)

**Step 1: Write the failing test**

Skip (no test runner). Note manual verification.

**Step 2: Implement minimal cache utility**

```ts
// src/lib/memory-cache.ts
// getCache(key) -> value or null
// setCache(key, value, ttlMs)
// auto-expire on read
```

**Step 3: Manual verification**

Read code to ensure TTL expiration logic is correct.

**Step 4: Commit**

```bash
git add src/lib/memory-cache.ts
git commit -m "feat: add in-memory cache helper"
```

---

### Task 2: Cache artist API response

**Files:**
- Modify: `src/app/api/artist/[id]/route.ts`

**Step 1: Write the failing test**

Skip (no test runner). Note manual verification.

**Step 2: Implement caching**

- Build cache key from: `artistId`, `page`, `pageSize`.
- TTL: 60–120 seconds.
- On cache hit, return cached payload and still record event.

**Step 3: Manual verification**

Hit the same endpoint twice and confirm second response is faster (log or timing).

**Step 4: Commit**

```bash
git add src/app/api/artist/[id]/route.ts
git commit -m "perf: cache artist api response"
```

---

### Task 3: Cache track API response

**Files:**
- Modify: `src/app/api/track/[id]/route.ts`

**Step 1: Write the failing test**

Skip (no test runner). Note manual verification.

**Step 2: Implement caching**

- Build cache key from: `trackId`.
- TTL: 60–120 seconds.
- On cache hit, return cached payload and still record event.

**Step 3: Manual verification**

Hit the same endpoint twice and confirm second response is faster.

**Step 4: Commit**

```bash
git add src/app/api/track/[id]/route.ts
git commit -m "perf: cache track api response"
```

---

### Task 4: Cache suggest API response

**Files:**
- Modify: `src/app/api/suggest/route.ts`

**Step 1: Write the failing test**

Skip (no test runner). Note manual verification.

**Step 2: Implement caching**

- Build cache key from: `query`.
- TTL: 30–60 seconds.
- On cache hit, return cached suggestions.

**Step 3: Manual verification**

Type same query twice; ensure no extra DB work (use logging or timing).

**Step 4: Commit**

```bash
git add src/app/api/suggest/route.ts
git commit -m "perf: cache suggest api response"
```

---

### Task 5: Build verification

**Step 1: Run build**

```bash
npm run build
```
Expected: PASS (requires `.env.local` in worktree)

**Step 2: Commit (if any)**

Only if changes needed after build.

