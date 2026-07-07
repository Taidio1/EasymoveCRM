# Low-RAM Docker Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make server-side Docker builds fit a VPS with about 2.5 GB RAM without changing application behavior.

**Architecture:** Next.js keeps the fast parallel build settings for normal local builds, but Docker sets `NEXT_LOW_MEMORY_BUILD=1` so the production image build uses one worker and disables parallel experimental compiles/traces. A deploy helper stops the running container before build to free memory, then starts the service again.

**Tech Stack:** Next.js 15 App Router, Docker Compose, POSIX shell, npm.

## Global Constraints

- Application runtime behavior must not change.
- The server deployment flow remains repo-based after `git pull`.
- Docker runtime output remains `standalone`.
- No Supabase, API, UI, auth, PWA, or database changes.

---

### Task 1: Low-Memory Next.js Build Mode

**Files:**
- Modify: `next.config.mjs`

**Interfaces:**
- Consumes: `process.env.NEXT_LOW_MEMORY_BUILD`
- Produces: Next experimental config with `cpus: 1` only when `NEXT_LOW_MEMORY_BUILD=1`

- [ ] **Step 1: Add a low-memory flag**

```js
const isLowMemoryBuild = process.env.NEXT_LOW_MEMORY_BUILD === "1"
```

- [ ] **Step 2: Gate experimental build settings**

```js
experimental: {
  ...(isLowMemoryBuild ? { cpus: 1 } : {}),
  webpackBuildWorker: !isLowMemoryBuild,
  parallelServerBuildTraces: !isLowMemoryBuild,
  parallelServerCompiles: !isLowMemoryBuild,
},
```

- [ ] **Step 3: Run build with low-memory flag**

Run: `NEXT_LOW_MEMORY_BUILD=1 npm run build`

Expected: Next build exits with code 0.

### Task 2: Docker Build Uses Low-Memory Mode

**Files:**
- Modify: `Dockerfile`

**Interfaces:**
- Consumes: Docker build arg `NEXT_LOW_MEMORY_BUILD`, default `1`
- Produces: `RUN npm run build` executed with low-memory env active

- [ ] **Step 1: Replace dependency install**

```dockerfile
RUN npm ci --no-audit --no-fund
```

- [ ] **Step 2: Add low-memory build arg and env**

```dockerfile
ARG NEXT_LOW_MEMORY_BUILD=1
ENV NEXT_LOW_MEMORY_BUILD=$NEXT_LOW_MEMORY_BUILD
```

- [ ] **Step 3: Keep existing build command**

```dockerfile
RUN npm run build
```

### Task 3: Server Deploy Helper

**Files:**
- Create: `scripts/deploy-low-ram.sh`

**Interfaces:**
- Consumes: optional env `COMPOSE_FILE`, default `docker-compose.yml`
- Consumes: optional env `SERVICE_NAME`, default `react-crm`
- Produces: stopped old service, rebuilt image, restarted service

- [ ] **Step 1: Detect Docker Compose command**

```sh
if docker compose version >/dev/null 2>&1; then
  compose() { docker compose "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  compose() { docker-compose "$@"; }
else
  echo "Docker Compose is not available." >&2
  exit 1
fi
```

- [ ] **Step 2: Stop service before build**

```sh
compose -f "$COMPOSE_FILE" down --remove-orphans
```

- [ ] **Step 3: Build and restart**

```sh
if compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"; then
  compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
else
  compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME" || true
  exit 1
fi
```

### Task 4: Trim Docker Context

**Files:**
- Modify: `.dockerignore`

**Interfaces:**
- Produces: smaller Docker build context without repo-only docs/cache/test artifacts

- [ ] **Step 1: Ignore local agent/docs/cache files**

```text
.claude
.fallow
.superpowers
docs
*.tsbuildinfo
*.test.ts
*.test.tsx
```

- [ ] **Step 2: Verify build still succeeds**

Run: `NEXT_LOW_MEMORY_BUILD=1 npm run build`

Expected: Next build exits with code 0.
