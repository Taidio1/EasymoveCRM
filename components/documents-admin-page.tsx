"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, Edit3, FilePlus2, ListChecks, Plus, Save, Trash2, Upload } from "lucide-react"
import { supabase } from "@/lib/superbase"
import {
  CLIENT_FIELD_DEFINITION_PRESETS,
  documentFieldDefinitionPresetKey,
} from "@/lib/document-field-definition-presets"
import { documentTemplateIdFromName } from "@/lib/document-template-id"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type {
  DocumentFieldDefinition,
  DocumentFieldDefinitionInput,
  DocumentMapping,
} from "@/lib/document-types"

const emptyFieldForm: DocumentFieldDefinitionInput = {
  label: "",
  dataKey: "",
  category: "",
  description: "",
  transform: "",
}

interface DocumentTemplateForm {
  name: string
}

const emptyTemplateForm: DocumentTemplateForm = {
  name: "",
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    const details = Array.isArray(body.details) ? `: ${body.details.join("; ")}` : ""
    return `${body.error ?? "Nieznany blad"}${details}`
  } catch {
    return "Nieznany blad"
  }
}

export function DocumentsAdminPage() {
  const [mappings, setMappings] = useState<DocumentMapping[]>([])
  const [definitions, setDefinitions] = useState<DocumentFieldDefinition[]>([])
  const [templateForm, setTemplateForm] = useState<DocumentTemplateForm>(emptyTemplateForm)
  const [templatePdfFile, setTemplatePdfFile] = useState<File | null>(null)
  const [templatePdfInputKey, setTemplatePdfInputKey] = useState(0)
  const [fieldForm, setFieldForm] = useState<DocumentFieldDefinitionInput>(emptyFieldForm)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [selectedMappingId, setSelectedMappingId] = useState("")
  const [status, setStatus] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isSavingField, setIsSavingField] = useState(false)
  const [isAddingPresets, setIsAddingPresets] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingTemplateName, setEditingTemplateName] = useState("")

  useEffect(() => {
    refreshAll()
  }, [])

  async function refreshAll() {
    await Promise.all([loadDefinitions(), loadMappings()])
  }

  async function loadDefinitions() {
    const res = await fetch("/api/documents/field-definitions")
    if (!res.ok) {
      setStatus(await readError(res))
      return
    }
    setDefinitions(await res.json())
  }

  async function loadMappings() {
    const headers = await getAuthHeaders()
    const res = await fetch("/api/documents/mappings", { headers })
    if (!res.ok) {
      setStatus(await readError(res))
      return
    }
    const data = await res.json() as DocumentMapping[]
    setMappings(data)
    setSelectedMappingId(current => current || data[0]?.id || "")
  }

  async function handleCreateTemplate(e: FormEvent) {
    e.preventDefault()
    setIsSavingTemplate(true)
    setStatus("")
    try {
      if (!templatePdfFile) {
        setStatus("Wybierz plik PDF")
        return
      }

      const templateId = documentTemplateIdFromName(templateForm.name)
      const formData = new FormData()
      formData.set("id", templateId)
      formData.set("name", templateForm.name)
      formData.set("pdf", templatePdfFile)

      const headers = await getAuthHeaders()
      const res = await fetch("/api/documents/mappings", {
        method: "POST",
        headers,
        body: formData,
      })
      if (!res.ok) {
        setStatus(await readError(res))
        return
      }
      const created = await res.json() as DocumentMapping
      setTemplateForm(emptyTemplateForm)
      setTemplatePdfFile(null)
      setTemplatePdfInputKey(key => key + 1)
      setSelectedMappingId(created.id)
      setStatus(`Utworzono szablon ${created.name}`)
      await loadMappings()
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleSaveTemplateName(mapping: DocumentMapping) {
    const nextName = editingTemplateName.trim()
    if (!nextName) {
      setStatus("Nazwa szablonu jest wymagana")
      return
    }
    setIsSavingTemplate(true)
    setStatus("")
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/documents/mappings/${mapping.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ ...mapping, name: nextName }),
      })
      if (!res.ok) {
        setStatus(await readError(res))
        return
      }
      setEditingTemplateId(null)
      setEditingTemplateName("")
      setStatus("Zapisano nazwę szablonu")
      await loadMappings()
    } finally {
      setIsSavingTemplate(false)
    }
  }

  function startTemplateNameEdit(mapping: DocumentMapping) {
    setEditingTemplateId(mapping.id)
    setEditingTemplateName(mapping.name)
  }

  async function handleDeleteTemplate(mapping: DocumentMapping) {
    setDeletingTemplateId(mapping.id)
    setStatus("")
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/documents/mappings/${mapping.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) {
        setStatus(await readError(res))
        return
      }
      const body = await res.json()
      setStatus(body.warning ? `Usunięto szablon. ${body.warning}` : `Usunięto szablon ${mapping.name}`)
      if (selectedMappingId === mapping.id) setSelectedMappingId("")
      await loadMappings()
    } finally {
      setDeletingTemplateId(null)
    }
  }

  async function handleSaveField(e: FormEvent) {
    e.preventDefault()
    setIsSavingField(true)
    setStatus("")
    try {
      const headers = await getAuthHeaders()
      const url = editingFieldId
        ? `/api/documents/field-definitions/${editingFieldId}`
        : "/api/documents/field-definitions"
      const res = await fetch(url, {
        method: editingFieldId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(fieldForm),
      })
      if (!res.ok) {
        setStatus(await readError(res))
        return
      }
      setFieldForm(emptyFieldForm)
      setEditingFieldId(null)
      setStatus(editingFieldId ? "Zapisano pole" : "Dodano pole")
      await loadDefinitions()
    } finally {
      setIsSavingField(false)
    }
  }

  async function createFieldDefinition(definition: DocumentFieldDefinitionInput): Promise<boolean> {
    const headers = await getAuthHeaders()
    const res = await fetch("/api/documents/field-definitions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(definition),
    })
    if (!res.ok) {
      setStatus(await readError(res))
      return false
    }
    return true
  }

  async function handleAddPreset(definition: DocumentFieldDefinitionInput) {
    setIsAddingPresets(true)
    setStatus("")
    try {
      if (await createFieldDefinition(definition)) {
        setStatus(`Dodano pole ${definition.dataKey}`)
        await loadDefinitions()
      }
    } finally {
      setIsAddingPresets(false)
    }
  }

  async function handleAddMissingPresets() {
    setIsAddingPresets(true)
    setStatus("")
    try {
      let added = 0
      for (const definition of missingPresets) {
        if (await createFieldDefinition(definition)) added++
      }
      setStatus(`Dodano brakujące pola: ${added}`)
      await loadDefinitions()
    } finally {
      setIsAddingPresets(false)
    }
  }

  async function handleDeleteField(id: string) {
    const headers = await getAuthHeaders()
    const res = await fetch(`/api/documents/field-definitions/${id}`, {
      method: "DELETE",
      headers,
    })
    if (!res.ok) {
      setStatus(await readError(res))
      return
    }
    if (editingFieldId === id) {
      setEditingFieldId(null)
      setFieldForm(emptyFieldForm)
    }
    setStatus("Usunieto pole")
    await loadDefinitions()
  }

  function editField(def: DocumentFieldDefinition) {
    setEditingFieldId(def.id)
    setFieldForm({
      label: def.label,
      dataKey: def.dataKey,
      category: def.category ?? "",
      description: def.description ?? "",
      transform: def.transform ?? "",
    })
  }

  const selectedMapping = mappings.find(mapping => mapping.id === selectedMappingId)
  const existingDefinitionKeys = new Set(definitions.map(documentFieldDefinitionPresetKey))
  const missingPresets = CLIENT_FIELD_DEFINITION_PRESETS.filter(def => !existingDefinitionKeys.has(documentFieldDefinitionPresetKey(def)))

  return (
    <div className="h-screen overflow-auto bg-bg p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-loosest text-text-mute">Dokumenty PDF</div>
            <h1 className="font-display text-[28px] font-medium leading-tight tracking-tightest text-text">
              Panel administracyjny
            </h1>
          </div>
          <div className="flex-1" />
          <Link
            href="/documents"
            className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-border bg-surface px-3 text-[12px] font-medium text-text hover:bg-surface-hover"
          >
            <ArrowLeft size={13} /> Wróć do dokumentów
          </Link>
          {status && (
            <div className="rounded-btn border border-border bg-surface px-3 py-2 text-[12px] text-text-dim">
              {status}
            </div>
          )}
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-card border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <FilePlus2 size={16} className="text-brand" />
              <h2 className="text-[14px] font-bold text-text">Szablony dokumentów</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-[12px]">
                <thead className="border-b border-border text-[10px] uppercase tracking-loosest text-text-mute">
                  <tr>
                    <th className="px-4 py-2">Nazwa</th>
                    <th className="px-4 py-2 text-right">Pola</th>
                    <th className="px-4 py-2 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(mapping => (
                    <tr key={mapping.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-medium text-text">
                        {editingTemplateId === mapping.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editingTemplateName}
                              onChange={e => setEditingTemplateName(e.target.value)}
                              className="h-8 min-w-0 flex-1 rounded-btn border border-border bg-bg px-2 text-[12px] text-text"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTemplateName(mapping)}
                              disabled={isSavingTemplate}
                              className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-border px-2 text-[12px] font-medium text-text hover:bg-surface-hover disabled:opacity-50"
                            >
                              <Save size={13} /> Zapisz
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingTemplateId(null); setEditingTemplateName("") }}
                              className="h-8 rounded-btn border border-border px-2 text-[12px] text-text-dim hover:bg-surface-hover"
                            >
                              Anuluj
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{mapping.name}</span>
                            <button
                              type="button"
                              onClick={() => startTemplateNameEdit(mapping)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-btn border border-border text-text-dim hover:bg-surface-hover hover:text-text"
                              title="Zmień nazwę"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-text-dim">{mapping.fields.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/documents/${mapping.id}/edit`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-border px-2.5 text-[12px] font-medium text-text hover:bg-surface-hover"
                          >
                            <Edit3 size={13} /> Mapuj PDF
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                disabled={deletingTemplateId === mapping.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border text-[var(--danger)] hover:bg-surface-hover disabled:opacity-50"
                                title="Usuń szablon"
                              >
                                <Trash2 size={13} />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-border bg-surface text-text">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Usunąć szablon?</AlertDialogTitle>
                                <AlertDialogDescription className="text-text-dim">
                                  Szablon „{mapping.name}” zostanie usunięty z listy dokumentów. Jeśli PDF był wgrany do Supabase, plik także zostanie usunięty.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border bg-bg text-text hover:bg-surface-hover">
                                  Anuluj
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(mapping)}
                                  className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                                >
                                  Usuń
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {mappings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[13px] text-text-mute">
                        Brak szablonów albo brak uprawnień do listy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCreateTemplate} className="rounded-card border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Plus size={15} className="text-brand" />
              <h3 className="text-[13px] font-bold text-text">Nowy szablon</h3>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[11px] text-text-mute">
                Nazwa
                <input
                  required
                  value={templateForm.name}
                  onChange={e => setTemplateForm(form => ({ ...form, name: e.target.value }))}
                  className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                  placeholder="Wniosek nowy"
                />
              </label>
              <label className="text-[11px] text-text-mute">
                Plik PDF
                <input
                  key={templatePdfInputKey}
                  required
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={e => setTemplatePdfFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text file:mr-3 file:rounded-btn file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-text"
                />
                {templatePdfFile && (
                  <span className="mt-1 block truncate text-[11px] text-text-dim">
                    {templatePdfFile.name}
                  </span>
                )}
              </label>
              <button
                disabled={isSavingTemplate || !templatePdfFile}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                <Upload size={14} /> Wgraj PDF i utwórz mapping
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-card border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ListChecks size={16} className="text-brand" />
            <h2 className="text-[14px] font-bold text-text">Słownik pól</h2>
          </div>
          <div className="border-b border-border px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Database size={15} className="text-brand" />
              <div className="text-[13px] font-bold text-text">Pola z bazy klienta</div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleAddMissingPresets}
                disabled={isAddingPresets || missingPresets.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-border px-3 text-[12px] font-medium text-text hover:bg-surface-hover disabled:opacity-50"
              >
                <Plus size={13} /> Dodaj brakujące pola z bazy klienta ({missingPresets.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingPresets.slice(0, 18).map(def => (
                <button
                  key={documentFieldDefinitionPresetKey(def)}
                  type="button"
                  onClick={() => handleAddPreset(def)}
                  disabled={isAddingPresets}
                  className="inline-flex h-7 items-center rounded-full border border-border px-2.5 text-[11px] text-text-dim hover:bg-surface-hover hover:text-text disabled:opacity-50"
                  title={documentFieldDefinitionPresetKey(def)}
                >
                  {def.label}
                </button>
              ))}
              {missingPresets.length > 18 && (
                <span className="inline-flex h-7 items-center rounded-full border border-border px-2.5 text-[11px] text-text-mute">
                  +{missingPresets.length - 18}
                </span>
              )}
              {missingPresets.length === 0 && (
                <span className="text-[12px] text-text-mute">Wszystkie pola z modelu klienta są już w słowniku.</span>
              )}
            </div>
          </div>
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[12px]">
                <thead className="border-b border-border text-[10px] uppercase tracking-loosest text-text-mute">
                  <tr>
                    <th className="px-4 py-2">Label</th>
                    <th className="px-4 py-2">dataKey</th>
                    <th className="px-4 py-2">Kategoria</th>
                    <th className="px-4 py-2">Opis</th>
                    <th className="px-4 py-2 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {definitions.map(def => (
                    <tr key={def.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-medium text-text">{def.label}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-text-dim">{documentFieldDefinitionPresetKey(def)}</td>
                      <td className="px-4 py-3 text-text-dim">{def.category ?? "-"}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-text-mute" title={def.description}>
                        {def.description ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => editField(def)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border text-text-dim hover:bg-surface-hover hover:text-text"
                            title="Edytuj"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(def.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border text-[var(--danger)] hover:bg-surface-hover"
                            title="Usuń"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleSaveField} className="border-t border-border p-4 lg:border-l lg:border-t-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-text">
                  {editingFieldId ? "Edycja pola" : "Dodaj pole"}
                </h3>
                {editingFieldId && (
                  <button
                    type="button"
                    onClick={() => { setEditingFieldId(null); setFieldForm(emptyFieldForm) }}
                    className="text-[12px] text-text-mute hover:text-text"
                  >
                    Anuluj
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[11px] text-text-mute">
                  label
                  <input
                    required
                    value={fieldForm.label}
                    onChange={e => setFieldForm(form => ({ ...form, label: e.target.value }))}
                    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                    placeholder="Imię i nazwisko"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  dataKey
                  <input
                    required
                    value={fieldForm.dataKey}
                    onChange={e => setFieldForm(form => ({ ...form, dataKey: e.target.value }))}
                    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                    placeholder="Name"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  Kategoria
                  <input
                    value={fieldForm.category ?? ""}
                    onChange={e => setFieldForm(form => ({ ...form, category: e.target.value }))}
                    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                    placeholder="Dane osobowe"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  Transform
                  <input
                    value={fieldForm.transform ?? ""}
                    onChange={e => setFieldForm(form => ({ ...form, transform: e.target.value }))}
                    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                    placeholder="uppercase"
                  />
                </label>
                <label className="text-[11px] text-text-mute">
                  Opis
                  <textarea
                    value={fieldForm.description ?? ""}
                    onChange={e => setFieldForm(form => ({ ...form, description: e.target.value }))}
                    className="mt-1 min-h-20 w-full resize-none rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
                    placeholder="Do czego służy pole"
                  />
                </label>
                <button
                  disabled={isSavingField}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <Save size={14} /> {editingFieldId ? "Zapisz pole" : "Dodaj pole"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Edit3 size={16} className="text-brand" />
            <h2 className="text-[14px] font-bold text-text">Mapowanie PDF</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-[11px] text-text-mute">
              Szablon
              <select
                value={selectedMappingId}
                onChange={e => setSelectedMappingId(e.target.value)}
                className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-[13px] text-text"
              >
                {mappings.map(mapping => (
                  <option key={mapping.id} value={mapping.id}>
                    {mapping.name} ({mapping.id})
                  </option>
                ))}
              </select>
            </label>
            {selectedMapping && (
              <Link
                href={`/documents/${selectedMapping.id}/edit`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn border border-border px-4 text-[13px] font-semibold text-text hover:bg-surface-hover"
              >
                <Edit3 size={14} /> Otwórz edytor mappingu
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
