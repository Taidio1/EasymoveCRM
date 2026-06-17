# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript Next.js CRM backed by Supabase. App Router pages and layouts live in `app/`; shared React components live in `components/`, with shadcn/Radix primitives in `components/ui/`. Business logic, Supabase clients, PDF generation, i18n, and utility code live in `lib/`. Tests are colocated in `lib/` as `*.test.ts`. Static files, fonts, PDF workers, and form templates live in `public/`; source PDF templates may also appear in `pdf/`. Database changes are kept in `supabase/migrations/`. Operational assets include `Dockerfile`, `docker-compose.yml`, `nginx/`, and helper scripts in `scripts/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies and copy the PDF.js worker via `postinstall`.
- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production Next.js build.
- `npm run start`: run the production server after building.
- `npm run lint`: run Next linting.
- `npm test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run inspect:pdf -- <file>`: inspect PDF form fields using `scripts/inspect-pdf.ts`.

## Coding Style & Naming Conventions

Use TypeScript with strict types and the `@/*` path alias for root imports. Match the existing style: two-space indentation, double quotes, and no semicolons in TS/TSX files. Components use PascalCase exports and kebab-case filenames where already established, for example `components/client-table.tsx`. Hooks belong in `hooks/` and should be named `use-*`. Keep Supabase access and document-generation logic in `lib/` rather than embedding it in UI components.

## Testing Guidelines

Vitest runs in the Node environment and currently includes `lib/**/*.test.ts`. Add tests beside the logic they cover, using focused names such as `document-store.test.ts`. Prefer deterministic unit tests for PDF mapping, validation, and data transforms. Run `npm test` before submitting changes that touch `lib/`, migrations, or document-generation flows.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style prefixes such as `feat:`, `fix:`, `docs:`, and `refactor:`. Keep commit subjects imperative and scoped to one change. Pull requests should describe the user-visible change, list validation commands run, link related issues or specs, and include screenshots or short recordings for UI changes.

## Security & Configuration Tips

Do not commit real secrets from `.env`; use `.env.example` for required variable names. Treat Supabase migrations as source-controlled schema changes and note any required dashboard/storage setup in the PR. When touching uploads or generated PDFs, preserve file size/type validation and avoid exposing private document URLs.
