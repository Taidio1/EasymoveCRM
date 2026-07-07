# Low-RAM Docker Build Design

## Goal

Allow the VPS with about 2.5 GB RAM to deploy after `git pull` by building the existing Next.js app in a low-memory mode. The application runtime behavior and user-facing features must stay unchanged.

## Approach

Keep the existing Docker-based deployment, but reduce build-time concurrency:

- Limit Next.js build workers to one CPU.
- Disable the experimental parallel server compile and build trace options.
- Keep `output: "standalone"` so the runtime image remains small.
- Use deterministic Docker dependency installation with `npm ci`.
- Add a deploy helper script that frees the currently running container before build and starts the app again after build.

## Operational Flow

On the server, the expected flow is:

```bash
git pull
./scripts/deploy-low-ram.sh
```

The script stops the current Compose service first to free RAM, builds the image with the low-memory Next.js configuration, and starts the service in detached mode.

## Non-Goals

- No UI, API, Supabase, PWA, auth, or feature behavior changes.
- No switch to GHCR/GitHub Actions in this change.
- No database migration changes.

## Verification

Run `npm run build` locally after the config change. The important confirmation is that the build still succeeds with the low-memory configuration.
