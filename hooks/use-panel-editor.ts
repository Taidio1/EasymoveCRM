"use client"

import { useState } from "react"
import type { Client } from "@/lib/superbase"

export interface UsePanelEditorOptions<TDraft extends Record<string, any>> {
  // Tworzy świeży draft z aktualnego klienta (wołane przy każdym wejściu w edycję).
  initial: () => TDraft
  // Buduje pełny patch (znormalizowane wartości) z draftu.
  toPatch: (draft: TDraft) => Partial<Client>
  // Zapis — woła handleSave ze strony; rzuca wyjątek przy błędzie.
  onSave: (patch: Partial<Client>) => Promise<void>
  // Opcjonalna walidacja — zwraca mapę błędów lub null.
  validate?: (draft: TDraft) => Record<string, string> | null
}

export interface PanelEditor<TDraft> {
  isEditing: boolean
  draft: TDraft
  errors: Record<string, string>
  isSaving: boolean
  startEdit: () => void
  cancel: () => void
  setField: <K extends keyof TDraft>(key: K, value: TDraft[K]) => void
  submit: () => Promise<void>
}

export function usePanelEditor<TDraft extends Record<string, any>>(
  options: UsePanelEditorOptions<TDraft>,
): PanelEditor<TDraft> {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<TDraft>(options.initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = () => {
    setDraft(options.initial())
    setErrors({})
    setIsEditing(true)
  }

  const cancel = () => {
    setErrors({})
    setIsEditing(false)
  }

  const setField = <K extends keyof TDraft>(key: K, value: TDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    const validationErrors = options.validate?.(draft) ?? null
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setIsSaving(true)
    try {
      await options.onSave(options.toPatch(draft))
      setIsEditing(false)
    } catch {
      // onSave pokazuje własny toast; zostajemy w edycji z zachowanym draftem.
    } finally {
      setIsSaving(false)
    }
  }

  return { isEditing, draft, errors, isSaving, startEdit, cancel, setField, submit }
}
