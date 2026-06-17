import type { DocumentFieldDefinitionInput } from "@/lib/document-types"

type DefinitionLike = Pick<DocumentFieldDefinitionInput, "label" | "dataKey" | "transform">

export const MAPPING_DROPDOWN_DATA_KEYS = [
  "Name",
  "CelPobytu",
  "PodLegPob",
  "Phone",
  "Adres",
  "Email",
  "Birthday",
  "Inspektor",
  "NumerSprawy",
  "Firma",
  "KrajPoch",
  "country_name",
] as const

const MAPPING_DROPDOWN_DATA_KEY_SET = new Set<string>(MAPPING_DROPDOWN_DATA_KEYS)
const MAPPING_DROPDOWN_DATA_KEY_ORDER = new Map<string, number>(
  MAPPING_DROPDOWN_DATA_KEYS.map((dataKey, index) => [dataKey, index]),
)

export function documentFieldDefinitionPresetKey(definition: Pick<DocumentFieldDefinitionInput, "dataKey" | "transform">): string {
  return definition.transform ? `${definition.dataKey}|${definition.transform}` : definition.dataKey
}

export function documentFieldDefinitionOptionLabel(definition: DefinitionLike): string {
  return `${definition.label} (${documentFieldDefinitionPresetKey(definition)})`
}

export function resolveDocumentFieldDefinitionSource<T extends DocumentFieldDefinitionInput>(
  definitions: T[],
): T[] | DocumentFieldDefinitionInput[] {
  return definitions.length ? definitions : CLIENT_FIELD_DEFINITION_PRESETS
}

export function filterDocumentFieldDefinitionsForMappingDropdown<T extends DocumentFieldDefinitionInput>(definitions: T[]): T[] {
  return definitions
    .filter(definition => MAPPING_DROPDOWN_DATA_KEY_SET.has(documentFieldDefinitionPresetKey(definition)))
    .sort((a, b) => (
      MAPPING_DROPDOWN_DATA_KEY_ORDER.get(documentFieldDefinitionPresetKey(a)) ?? Number.MAX_SAFE_INTEGER
    ) - (
      MAPPING_DROPDOWN_DATA_KEY_ORDER.get(documentFieldDefinitionPresetKey(b)) ?? Number.MAX_SAFE_INTEGER
    ))
}

export const CLIENT_FIELD_DEFINITION_PRESETS: DocumentFieldDefinitionInput[] = [
  { label: "Imię i nazwisko", dataKey: "Name", category: "Dane osobowe", description: "Pełna nazwa klienta" },
  { label: "Imię i nazwisko wielkimi literami", dataKey: "Name", category: "Dane osobowe", description: "Pełna nazwa klienta w formacie uppercase", transform: "uppercase" },
  { label: "Email", dataKey: "Email", category: "Kontakt", description: "Adres email klienta" },
  { label: "Telefon", dataKey: "Phone", category: "Kontakt", description: "Numer telefonu klienta" },
  { label: "Data urodzenia", dataKey: "Birthday", category: "Dane osobowe", description: "Data urodzenia klienta" },
  { label: "Kraj pochodzenia", dataKey: "KrajPoch", category: "Dane osobowe", description: "Kraj pochodzenia klienta" },
  { label: "Kraj pochodzenia z tabeli krajów", dataKey: "country_name", category: "Dane osobowe", description: "Nazwa kraju z relacji countries" },
  { label: "Adres", dataKey: "Adres", category: "Adres", description: "Pełny adres klienta" },
  { label: "Ulica", dataKey: "Adres", category: "Adres", description: "Ulica wyciągnięta z pełnego adresu", transform: "address_street" },
  { label: "Numer budynku/lokalu", dataKey: "Adres", category: "Adres", description: "Numer wyciągnięty z pełnego adresu", transform: "address_number" },
  { label: "Kod pocztowy", dataKey: "Adres", category: "Adres", description: "Kod pocztowy wyciągnięty z pełnego adresu", transform: "address_zip" },
  { label: "Miasto", dataKey: "Adres", category: "Adres", description: "Miasto wyciągnięte z pełnego adresu", transform: "address_city" },
  { label: "Status klienta", dataKey: "Status", category: "Sprawa", description: "Aktualny status klienta" },
  { label: "Cel pobytu", dataKey: "CelPobytu", category: "Sprawa", description: "Deklarowany cel pobytu" },
  { label: "Podstawa legalnego pobytu", dataKey: "PodLegPob", category: "Sprawa", description: "Podstawa legalnego pobytu klienta" },
  { label: "Status płatności", dataKey: "StatusPla", category: "Finanse", description: "Status płatności klienta" },
  { label: "Suma wydatków", dataKey: "TotalSpend", category: "Finanse", description: "Łączna kwota wydatków klienta" },
  { label: "Numer sprawy", dataKey: "NumerSprawy", category: "Sprawa", description: "Wewnętrzny numer sprawy" },
  { label: "Inspektor", dataKey: "Inspektor", category: "Sprawa", description: "Inspektor prowadzący sprawę" },
  { label: "Firma", dataKey: "Firma", category: "Praca", description: "Firma lub pracodawca klienta" },
  { label: "Dokument", dataKey: "Doc", category: "Dokumenty", description: "Pole dokumentu klienta" },
  { label: "Notatki", dataKey: "Notes", category: "Sprawa", description: "Notatki do sprawy klienta" },
  { label: "Twórca rekordu", dataKey: "Creator", category: "System", description: "Użytkownik lub źródło utworzenia rekordu" },
  { label: "Data utworzenia", dataKey: "CreatedDate", category: "System", description: "Data utworzenia rekordu klienta" },
  { label: "Data złożenia wniosku", dataKey: "DataZloWnio", category: "Terminy", description: "Data złożenia wniosku" },
  { label: "Data wydania wniosku", dataKey: "DataWydWni", category: "Terminy", description: "Data wydania wniosku" },
  { label: "Data odbioru karty pobytu", dataKey: "DataOdbKartyPob", category: "Terminy", description: "Data odbioru karty pobytu" },
  { label: "Data odbioru decyzji", dataKey: "DataOdbDecyzji", category: "Terminy", description: "Data odbioru decyzji" },
  { label: "Data zakończenia legalnego pobytu", dataKey: "DataZakLegPob", category: "Terminy", description: "Data zakończenia legalnego pobytu" },
  { label: "Formularz wniosku", dataKey: "FormWni", category: "Dokumenty", description: "Czy formularz wniosku jest dostępny" },
  { label: "Załącznik nr 1", dataKey: "ZalNrJed", category: "Dokumenty", description: "Czy załącznik nr 1 jest dostępny" },
  { label: "Kopia paszportu", dataKey: "KopiaPasz", category: "Dokumenty", description: "Czy kopia paszportu jest dostępna" },
  { label: "Załącznik Blue Card", dataKey: "ZalBlue", category: "Dokumenty", description: "Czy załącznik Blue Card jest dostępny" },
  { label: "Cztery zdjęcia", dataKey: "CzteZdjecia", category: "Dokumenty", description: "Czy zdjęcia są dostępne" },
  { label: "Pełnomocnictwo", dataKey: "Pelnomocnictwo", category: "Dokumenty", description: "Czy pełnomocnictwo jest dostępne" },
]
