"use client"

import { Button } from "@/components/ui/button"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface EditActionsProps {
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export function EditActions({ isEditing, isSaving, onEdit, onSave, onCancel }: EditActionsProps) {
  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 md:h-7 md:w-7 text-text-mute hover:text-text"
        onClick={onEdit}
        aria-label="Edytuj"
      >
        <Pencil className="h-4 w-4 md:h-3.5 md:w-3.5" />
      </Button>
    )
  }

  return (
    <>
      {/* Desktop: kompaktowe przyciski w nagłówku karty (bez zmian). */}
      <div className="hidden md:flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-text-mute hover:text-text"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Anuluj
        </Button>
        <Button
          size="sm"
          className="h-7 px-2 bg-brand hover:bg-brand-hover text-white"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
          Zapisz
        </Button>
      </div>

      {/*
        Mobile: przyklejony pasek na dole ekranu, zawsze w zasięgu kciuka.
        Nakłada się na MobileNav (z-20) w trakcie edycji. Zakłada edycję
        jednego panelu naraz — naturalne dla edycji inline.
      */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-bg border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <Button
          variant="outline"
          className="flex-1 h-11 text-sm font-medium border-border-strong text-text-dim hover:text-text"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1.5" />
          Anuluj
        </Button>
        <Button
          className="flex-1 h-11 text-sm font-semibold bg-brand hover:bg-brand-hover text-white"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Zapisz
        </Button>
      </div>
    </>
  )
}
