import fs from "fs/promises"
import path from "path"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { DocumentMapping, FieldMapping } from "@/lib/document-types"

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

async function readFromFile(id: string): Promise<DocumentMapping> {
  const p = path.join(process.cwd(), "mappings", `${id}.json`)
  const raw = await fs.readFile(p, "utf-8")
  return JSON.parse(raw) as DocumentMapping
}

export async function getMapping(id: string): Promise<DocumentMapping> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("document_mappings")
      .select("id, name, pdf_path, fields")
      .eq("id", id)
      .single()
    if (error || !data) throw error ?? new Error("brak wiersza")
    return { id: data.id, name: data.name, pdfPath: data.pdf_path, fields: data.fields }
  } catch {
    // Fallback: plik JSON z repo (seed / DB niedostępne)
    return readFromFile(id)
  }
}

export async function saveMapping(id: string, mapping: DocumentMapping): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .from("document_mappings")
    .upsert({
      id,
      name: mapping.name,
      pdf_path: mapping.pdfPath,
      fields: mapping.fields,
      updated_at: new Date().toISOString(),
    })
    .select("updated_at")
    .single()
  if (error) throw new Error(`Zapis mappingu nie powiódł się: ${error.message}`)
  return data.updated_at
}
