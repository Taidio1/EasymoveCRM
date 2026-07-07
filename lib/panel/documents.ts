import { supabase } from "@/lib/superbase"

export interface PanelFile { name: string; path: string }

const BUCKET = "documents"
const SIGNED_TTL = 60 * 5 // 5 minut

async function listFolder(clientId: string, sub: "uploads" | "office"): Promise<PanelFile[]> {
  const prefix = `${clientId}/${sub}`
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    sortBy: { column: "created_at", order: "desc" },
  })
  if (error || !data) return []
  return data
    .filter((f) => f.id !== null) // pomiń pod-foldery
    .map((f) => ({ name: f.name.replace(/^\d+_/, ""), path: `${prefix}/${f.name}` }))
}

export const listMyUploads = (clientId: string) => listFolder(clientId, "uploads")
export const listOfficeDocs = (clientId: string) => listFolder(clientId, "office")

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL)
  if (error) { console.error("getSignedUrl:", error.message); return null }
  return data.signedUrl
}

export async function uploadMyDocument(clientId: string, file: File): Promise<boolean> {
  const path = `${clientId}/uploads/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  })
  if (error) { console.error("uploadMyDocument:", error.message); return false }
  return true
}
