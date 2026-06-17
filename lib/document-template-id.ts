const POLISH_CHARACTERS: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
}

export function documentTemplateIdFromName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, char => POLISH_CHARACTERS[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || "document-template"
}
