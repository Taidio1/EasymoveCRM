# Upload PDF templates for document mappings

## Goal

On `/documents/admin`, an admin can create a new document template by selecting a PDF file instead of manually typing a local `/forms/...` path. The PDF is stored in Supabase Storage and the newly created mapping can immediately be opened in the mapping editor.

## Current state

Document templates are stored in `public.document_mappings` with `id`, `name`, `pdf_path`, and `fields`. The admin page posts JSON to `/api/documents/mappings`, which creates an empty mapping. Existing PDF paths point to files in `public/forms`. The mapping editor renders `mapping.pdfPath` in the browser, while PDF generation currently reads the file from disk under `public/`.

## Approach

Use a dedicated Supabase Storage bucket for templates, with a stable path prefix such as `templates/<templateId>.pdf`. The admin upload will go through a server API route protected by `requireDocumentsAdmin`, so the browser never needs broad Storage permissions for template files.

The mapping row will store an app URL in `pdf_path`, for example `/api/documents/templates/<templateId>/pdf`. That endpoint streams the PDF from Supabase Storage using the server-side service-role client. This keeps the bucket private and gives both the browser preview and server-side generation a stable application-owned URL.

Existing local `/forms/...` paths remain supported for seeded templates and development fallback.

## User flow

The `Nowy szablon` form contains `id`, `name`, and a PDF file input. Submitting the form sends `multipart/form-data` with the metadata and the file. The server validates:

- the requester is an admin,
- `id` and `name` are present,
- the uploaded file exists,
- the uploaded file is a PDF by MIME type or `.pdf` extension,
- the file is within the configured size limit.

After upload succeeds, the server creates the empty mapping with `fields: []`, stores the proxy PDF path in `pdf_path`, and returns the created mapping. The UI resets the form, refreshes the mapping list, selects the created mapping, and lets the user open `Mapuj PDF`.

## Components and API

- `components/documents-admin-page.tsx`: replace the manual path workflow with a file input, upload status, and `FormData` submission.
- `app/api/documents/mappings/route.ts`: accept both JSON for backward compatibility and multipart form submissions for PDF template creation.
- `lib/document-template-storage.ts`: centralize bucket name, path construction, upload validation, upload, and download helpers.
- `app/api/documents/templates/[id]/pdf/route.ts`: stream the stored PDF for preview and mapping.
- `lib/document-generator.ts`: load template bytes from local public files or the app proxy/Supabase template source.

## Storage model

Default bucket: `document-templates`.

Default object path: `templates/<templateId>.pdf`.

The implementation should make the bucket name a constant so it can be changed in one place. If the bucket does not exist, the upload should return a clear error that tells the admin which bucket is missing, rather than silently falling back to local storage.

## Error handling

The UI shows the API error returned by `readError`. Failed upload must not create a mapping row. Failed mapping creation after upload should attempt to remove the uploaded object; if cleanup fails, the API should still return the original mapping error plus cleanup context.

The PDF proxy endpoint returns `404` for missing mappings or missing Storage objects, and `500` for unexpected Storage/client errors.

## Testing

Add focused Vitest coverage for storage path construction and template PDF source detection. Keep existing document store tests passing. Manual verification should cover:

- creating a template with a PDF,
- rejecting a non-PDF file,
- opening the mapping editor for the new template,
- generating a PDF from a Supabase-backed template,
- ensuring existing `/forms/...` templates still generate.

## Out of scope

This change does not add delete/replace controls for template PDFs, migrate existing local PDFs into Storage, or redesign the mapping editor.
