import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { DocumentFieldDefinition, DocumentFieldDefinitionInput } from "@/lib/document-types"

type FieldDefinitionRow = {
  id: string
  label: string
  data_key: string
  category: string | null
  description: string | null
  transform: string | null
  created_at?: string
  updated_at?: string
}

function cleanRequired(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function cleanOptional(value: unknown): string | undefined {
  const text = cleanRequired(value)
  return text ? text : undefined
}

function rowToFieldDefinition(row: FieldDefinitionRow): DocumentFieldDefinition {
  return {
    id: row.id,
    label: row.label,
    dataKey: row.data_key,
    category: row.category ?? undefined,
    description: row.description ?? undefined,
    transform: row.transform ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function normalizeFieldDefinitionInput(input: unknown): DocumentFieldDefinitionInput {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const normalized: DocumentFieldDefinitionInput = {
    label: cleanRequired(value.label),
    dataKey: cleanRequired(value.dataKey),
  }
  const category = cleanOptional(value.category)
  const description = cleanOptional(value.description)
  const transform = cleanOptional(value.transform)
  if (category) normalized.category = category
  if (description) normalized.description = description
  if (transform) normalized.transform = transform
  return normalized
}

export function validateFieldDefinitionInput(input: unknown): string[] {
  const normalized = normalizeFieldDefinitionInput(input)
  const errors: string[] = []
  if (!normalized.label) errors.push("Brak label")
  if (!normalized.dataKey) errors.push("Brak dataKey")
  return errors
}

export function fieldDefinitionToMappingDataKey(definition: DocumentFieldDefinitionInput): string {
  const normalized = normalizeFieldDefinitionInput(definition)
  return normalized.transform ? `${normalized.dataKey}|${normalized.transform}` : normalized.dataKey
}

export async function listFieldDefinitions(): Promise<DocumentFieldDefinition[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("document_field_definitions")
    .select("id, label, data_key, category, description, transform, created_at, updated_at")
    .order("category", { ascending: true, nullsFirst: false })
    .order("label", { ascending: true })
  if (error) throw new Error(`Odczyt słownika pól nie powiódł się: ${error.message}`)
  return ((data ?? []) as FieldDefinitionRow[]).map(rowToFieldDefinition)
}

export async function createFieldDefinition(input: unknown): Promise<DocumentFieldDefinition> {
  const errors = validateFieldDefinitionInput(input)
  if (errors.length) throw new Error(errors.join("; "))
  const normalized = normalizeFieldDefinitionInput(input)
  const { data, error } = await getSupabaseAdmin()
    .from("document_field_definitions")
    .insert({
      label: normalized.label,
      data_key: normalized.dataKey,
      category: normalized.category ?? null,
      description: normalized.description ?? null,
      transform: normalized.transform ?? null,
    })
    .select("id, label, data_key, category, description, transform, created_at, updated_at")
    .single()
  if (error) throw new Error(`Dodanie pola nie powiodło się: ${error.message}`)
  return rowToFieldDefinition(data as FieldDefinitionRow)
}

export async function updateFieldDefinition(id: string, input: unknown): Promise<DocumentFieldDefinition> {
  const errors = validateFieldDefinitionInput(input)
  if (errors.length) throw new Error(errors.join("; "))
  const normalized = normalizeFieldDefinitionInput(input)
  const { data, error } = await getSupabaseAdmin()
    .from("document_field_definitions")
    .update({
      label: normalized.label,
      data_key: normalized.dataKey,
      category: normalized.category ?? null,
      description: normalized.description ?? null,
      transform: normalized.transform ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, label, data_key, category, description, transform, created_at, updated_at")
    .single()
  if (error) throw new Error(`Aktualizacja pola nie powiodła się: ${error.message}`)
  return rowToFieldDefinition(data as FieldDefinitionRow)
}

export async function deleteFieldDefinition(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("document_field_definitions")
    .delete()
    .eq("id", id)
  if (error) throw new Error(`Usunięcie pola nie powiodło się: ${error.message}`)
}
