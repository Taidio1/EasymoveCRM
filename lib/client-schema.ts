import * as z from "zod"

// Pełny schemat klienta — źródło prawdy dla modalu i edycji inline w panelach.
export const clientFormSchema = z.object({
  Name: z.string().min(2, { message: "Imię i nazwisko musi mieć co najmniej 2 znaki." }),
  Status: z.string().min(1, { message: "Status jest wymagany." }),
  CelPobytu: z.string().optional(),
  PodLegPob: z.string().optional(),
  KrajPoch: z.string().optional(),
  Phone: z.string().optional(),
  Adres: z.string().nullable().optional(),
  StatusPla: z.string().optional(),
  Email: z.string().email({ message: "Niepoprawny adres e-mail." }).optional().or(z.literal("")),
  Birthday: z.string().optional(),
  Notes: z.string().optional(),
  Creator: z.string().optional(),
  TotalSpend: z.string().optional(),
  NumerSprawy: z.string().optional(),
  Inspektor: z.string().optional(),
  Firma: z.string().optional(),
  DataZloWnio: z.string().optional(),
  DataWydWni: z.string().optional(),
  DataOdbKartyPob: z.string().optional(),
  DataOdbDecyzji: z.string().optional(),
  DataZakLegPob: z.string().optional(),
  FormWni: z.boolean().default(false),
  ZalNrJed: z.boolean().default(false),
  KopiaPasz: z.boolean().default(false),
  ZalBlue: z.boolean().default(false),
  CzteZdjecia: z.boolean().default(false),
  Pelnomocnictwo: z.boolean().default(false),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

// Per-panel pick-schematy (walidacja tylko pól danego panelu).
export const headerSchema = clientFormSchema.pick({ Name: true, Status: true, CelPobytu: true, KrajPoch: true })
export const contactSchema = clientFormSchema.pick({ Email: true, Phone: true, Adres: true, Firma: true, Inspektor: true })
export const financesSchema = clientFormSchema.pick({ TotalSpend: true, StatusPla: true })
export const notesSchema = clientFormSchema.pick({ Notes: true })
export const caseDataSchema = clientFormSchema.pick({
  NumerSprawy: true, PodLegPob: true, Birthday: true,
  DataZloWnio: true, DataWydWni: true, DataOdbKartyPob: true, DataOdbDecyzji: true, DataZakLegPob: true,
})

// Waliduje draft danym schematem. Zwraca mapę { pole: komunikat } lub null gdy OK.
export function validateWith<T extends z.ZodTypeAny>(
  schema: T,
  draft: unknown,
): Record<string, string> | null {
  const result = schema.safeParse(draft)
  if (result.success) return null
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "")
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}
