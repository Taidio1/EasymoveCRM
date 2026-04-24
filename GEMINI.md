# GEMINI.md: Project Overview

This document provides a comprehensive overview of the **React CRM** project, intended to be used as a primary context source for AI-driven development.

## 1. Project Overview

This is a modern Customer Relationship Management (CRM) system built with a Next.js frontend and a Supabase backend. The application is designed to manage clients, their documents, and track various business metrics. The UI is built with Shadcn UI and styled with Tailwind CSS. The entire codebase is written in TypeScript and follows strict type-checking rules.

### Core Functionalities:
- **Dashboard:** Analytics overview with charts for revenue and client growth.
- **Client Management:** Full CRUD (Create, Read, Update, Delete) operations for client records.
- **Document Management:** Secure upload, download, and storage of client-related documents (PDF, Word) using Supabase Storage.
- **Role-Based Access Control (RBAC):** Different user roles (Admin, Boss, Employee) with varying permissions, managed via Supabase Auth.
- **Data Visualization:** Charts displaying business trends.
- **Public Forms:** A standalone form for new clients to register and upload documents.

### Key Technologies:
- **Framework:** Next.js 15 / React 19
- **Language:** TypeScript (Strict)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** Shadcn UI, Radix UI
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form with Zod for validation
- **State Management:** React Hooks & Context API (via `AppProviders.tsx`)
- **Deployment:** Docker support is available, and it's configured for Vercel/Netlify-like platforms.

## 2. Building and Running

The project uses `pnpm` as the primary package manager (inferred from `pnpm-lock.yaml`).

### Key Commands:
- **Install Dependencies:**
  ```bash
  pnpm install
  ```
- **Run Development Server:** Starts the app on `http://localhost:3000`.
  ```bash
  pnpm dev
  ```
- **Create Production Build:**
  ```bash
  pnpm build
  ```
- **Run Production Server:**
  ```bash
  pnpm start
  ```
- **Lint the Code:**
  ```bash
  pnpm lint
  ```

### Environment Configuration:
- The application requires a `.env.local` file in the root directory with Supabase credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

## 3. Project Structure & Conventions

- **Application Entrypoint:** `app/layout.tsx` is the root layout, which wraps children in `app/AppProviders.tsx`.
- **Global Providers:** `app/AppProviders.tsx` sets up essential contexts: `ThemeProvider`, `AuthProvider`, `AuthGuard`, and `SidebarProvider`.
- **Data Layer:** All Supabase interactions (auth, database, storage) are centralized in `lib/superbase.ts`. **Note: There is a typo in this filename; it should likely be `supabase.ts`.**
- **Routing:** The app uses the Next.js App Router. Pages are located in the `app/` directory (e.g., `app/clients/page.tsx`).
- **UI Components:** Reusable UI components are in `components/`. The `components/ui` directory contains the base components from Shadcn UI.
- **Type Safety:** The project is configured with `"strict": true` in `tsconfig.json`, enforcing strong type-checking.
- **Path Aliases:** The project uses the `@/*` alias for absolute imports from the root directory (e.g., `import ... from '@/components/...'`).
- **Build Configuration:** According to `next.config.mjs`, both TypeScript and ESLint errors are currently ignored during the production build (`ignoreBuildErrors: true`). This is a potential risk and should be noted.
- **Internationalization (i18n):** The root layout specifies `lang="pl"`, indicating the primary language is Polish. A file at `lib/i18n.ts` suggests i18n capabilities.

## 4. Document Generation Analysis (Target for Repair)

The application features a "Reports" page (`/app/reports/page.tsx`) for generating various PDF documents. This functionality is split into two distinct systems: one that works, and one that is the primary target for repair.

### 4.1. System 1: PDF Generation from Scratch (Functional)

- **Purpose:** To create custom reports and simple documents programmatically.
- **Core Logic:** `lib/pdf-generator.ts`. This file uses the `jsPDF` and `jspdf-autotable` libraries.
- **UI Trigger:** The first three tabs ("Dokumenty klienta", "Listy klientów", "Statystyki") within the `components/reports.tsx` component.
- **Functionality:**
  - Generates single-client documents like a "Client Card" or "Power of Attorney".
  - Generates multi-client lists.
  - Generates aggregate statistical reports.
- **Status:** ✅ **Functional.** This system appears to work as intended.

### 4.2. System 2: PDF Form Filling (Broken - **Primary Target**)

- **Purpose:** To fill existing, official government PDF forms with client data. Specifically, the "Wniosek o pobyt czasowy" (Temporary Residence Permit Application).
- **Core Logic:** `lib/pdf-form-filler.ts`. This file uses the `pdf-lib` library to load and manipulate existing PDF files.
- **UI Trigger:** The "Formularze urzędowe" (Official Forms) tab in `components/reports.tsx`, which renders the `components/form-generator.tsx` component.
- **Status:** ❌ **Non-functional and deliberately bypassed.**

#### Problem Description:

The form-filling system is currently broken for two main reasons:

1.  **Missing PDF Template:** The system is designed to load a template from `public/forms/wniosek_pobyt_czasowy.pdf`, but this file does not exist in the repository. The UI (`form-generator.tsx`) explicitly warns the user about this.

2.  **Bypassed Logic:** The core function `downloadFilledForm` in `lib/pdf-form-filler.ts` has been intentionally altered to *not* attempt to load the template. Instead, it directly calls `createSimpleFormDocument`, a fallback function that generates a basic, non-official "substitute" PDF from scratch. The code comment `// Zamiast próbować ładować PDF, od razu generujemy dokument zastępczy` (Instead of trying to load the PDF, we immediately generate a substitute document) confirms this is intentional, likely as a temporary measure.

#### Path to Remediation:

To make this feature functional, the following steps are required:

1.  **Acquire and Place Template:** The official, fillable PDF form for the "Wnioseok o pobyt czasowy" must be obtained and placed at the correct path: `public/forms/wniosek_pobyt_czasowy.pdf`.
2.  **Restore Form-Filling Logic:** The `downloadFilledForm` function in `lib/pdf-form-filler.ts` must be refactored. It should be changed to:
    a. Fetch the PDF template from the `FORM_PDF_URL`.
    b. Pass the resulting `ArrayBuffer` to the `fillTemporaryResidenceForm` function.
    c. The `fillTemporaryResidenceForm` function contains the logic for mapping client data to PDF form fields. This logic may need to be debugged and adjusted to match the fields in the actual template PDF.
3.  **Update UI:** The `Alert` message in `components/form-generator.tsx` warning about the missing file should be removed, and the button text should be changed to reflect that the official form is being generated.

