import type { Client } from "@/lib/superbase"

type DocBoolField = Extract<keyof Client,
  "FormWni" | "KopiaPasz" | "CzteZdjecia" | "ZalNrJed" | "ZalBlue" | "Pelnomocnictwo">

export interface RequiredDoc { key: DocBoolField; label: string }

export const REQUIRED_DOCS: RequiredDoc[] = [
  { key: "FormWni",        label: "Formularz wniosku" },
  { key: "KopiaPasz",      label: "Kopia paszportu" },
  { key: "CzteZdjecia",    label: "4 zdjęcia" },
  { key: "ZalNrJed",       label: "Załącznik nr 1" },
  { key: "ZalBlue",        label: "Niebieski załącznik" },
  { key: "Pelnomocnictwo", label: "Pełnomocnictwo" },
]
