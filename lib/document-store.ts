import fs from "fs/promises"
import path from "path"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { normalizeMappingFieldsToGrid } from "@/lib/mapping-field-controls"
import type { DocumentMapping, DocumentTemplateInput, FieldMapping } from "@/lib/document-types"

function cleanRequired(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function deleteMapping(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("document_mappings")
    .delete()
    .eq("id", id)
  if (error) throw new Error(`Usuniecie mappingu nie powiodlo sie: ${error.message}`)
}

export function validateMapping(m: DocumentMapping): string[] {
  const errors: string[] = []
  if (!m || typeof m !== "object") return ["Mapping nie jest obiektem"]
  if (!m.name) errors.push("Brak name")
  if (!m.pdfPath) errors.push("Brak pdfPath")
  if (!Array.isArray(m.fields)) {
    errors.push("fields nie jest tablicą")
    return errors
  }
  m.fields.forEach((f: FieldMapping, i: number) => {
    const num = (v: unknown) => typeof v === "number" && Number.isFinite(v)
    if (!num(f.page)) errors.push(`Pole ${i}: page nie jest liczbą`)
    if (!num(f.x)) errors.push(`Pole ${i}: x nie jest liczbą`)
    if (!num(f.y)) errors.push(`Pole ${i}: y nie jest liczbą`)
    if (!num(f.fontSize)) errors.push(`Pole ${i}: fontSize nie jest liczbą`)
    if (!f.dataKey) errors.push(`Pole ${i}: brak dataKey`)
    if (f.type === "grid" && !num(f.boxWidth)) errors.push(`Pole ${i}: grid bez boxWidth`)
  })
  return errors
}

export function normalizeDocumentMapping(mapping: DocumentMapping): DocumentMapping {
  return {
    ...mapping,
    fields: normalizeMappingFieldsToGrid(mapping.fields),
  }
}

export function normalizeDocumentTemplateInput(input: unknown): DocumentTemplateInput {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {}
  return {
    id: cleanRequired(value.id),
    name: cleanRequired(value.name),
    pdfPath: cleanRequired(value.pdfPath),
  }
}

export function validateDocumentTemplateInput(input: unknown): string[] {
  const normalized = normalizeDocumentTemplateInput(input)
  const errors: string[] = []
  if (!normalized.id) errors.push("Brak id")
  if (!normalized.name) errors.push("Brak name")
  if (!normalized.pdfPath) errors.push("Brak pdfPath")
  return errors
}

async function readFromFile(id: string): Promise<DocumentMapping> {
  const p = path.join(process.cwd(), "mappings", `${id}.json`)
  const raw = await fs.readFile(p, "utf-8")
  return normalizeDocumentMapping(JSON.parse(raw) as DocumentMapping)
}

export async function getMapping(id: string): Promise<DocumentMapping> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("document_mappings")
      .select("id, name, pdf_path, fields")
      .eq("id", id)
      .single()
    if (error || !data) throw error ?? new Error("brak wiersza")
    return normalizeDocumentMapping({ id: data.id, name: data.name, pdfPath: data.pdf_path, fields: data.fields })
  } catch {
    // Fallback: plik JSON z repo (seed / DB niedostępne)
    return readFromFile(id)
  }
}

export async function listMappings(): Promise<DocumentMapping[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("document_mappings")
    .select("id, name, pdf_path, fields")
    .order("name", { ascending: true })
  if (error) throw new Error(`Odczyt mappingów nie powiódł się: ${error.message}`)
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    pdfPath: row.pdf_path,
    fields: normalizeMappingFieldsToGrid(row.fields),
  })) as DocumentMapping[]
}

export async function createEmptyMapping(input: unknown): Promise<DocumentMapping> {
  const errors = validateDocumentTemplateInput(input)
  if (errors.length) throw new Error(errors.join("; "))
  const normalized = normalizeDocumentTemplateInput(input)
  const mapping: DocumentMapping = { ...normalized, fields: [] }
  await saveMapping(normalized.id, mapping)
  return mapping
}

export async function saveMapping(id: string, mapping: DocumentMapping): Promise<string> {
  const normalized = normalizeDocumentMapping(mapping)
  const { data, error } = await getSupabaseAdmin()
    .from("document_mappings")
    .upsert({
      id,
      name: normalized.name,
      pdf_path: normalized.pdfPath,
      fields: normalized.fields,
      updated_at: new Date().toISOString(),
    })
    .select("updated_at")
    .single()
  if (error) throw new Error(`Zapis mappingu nie powiódł się: ${error.message}`)
  return data.updated_at
}
