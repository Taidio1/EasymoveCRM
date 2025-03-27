"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { type Client, addClient } from "@/lib/superbase"

// Schemat formularza klienta
const clientFormSchema = z.object({
  Name: z.string().min(2, {
    message: "Imię i nazwisko musi mieć co najmniej 2 znaki.",
  }),
  Status: z.string().min(1, {
    message: "Status jest wymagany.",
  }),
  CelPobytu: z.string().optional(),
  PodLegPob: z.string().optional(),
  KrajPoch: z.string().optional(),
  Phone: z.string().optional(),
  Adres: z.string().nullable().optional(),
  StatusPla: z.string().optional(),
  Email: z
    .string()
    .email({
      message: "Wprowadź prawidłowy adres email.",
    })
    .optional(),
  Birthday: z.string().optional(),
  Notes: z.string().optional(),
  Creator: z.string().optional(),
  Firma: z.string().optional(),
  NumerSprawy: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

interface CreateClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: (client: Client) => void
}

export function CreateClientModal({ open, onOpenChange, onClientCreated }: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicjalizacja formularza z wartościami domyślnymi
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      Name: "",
      Status: "Aktywny",
      CelPobytu: "",
      PodLegPob: "",
      KrajPoch: "",
      Phone: "",
      Adres: "",
      StatusPla: "Brak Info.",
      Email: "",
      Birthday: "",
      Notes: "",
      Creator: "",
      Firma: "",
      NumerSprawy: "",
    },
  })

  // Obsługa przesyłania formularza
  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true)

    try {
      // Przygotowanie danych klienta - konwersja undefined na null
      const clientData: Omit<Client, "id" | "created_at"> = {
        Name: data.Name,
        Status: data.Status,
        CelPobytu: data.CelPobytu || null,
        PodLegPob: data.PodLegPob || null,
        KrajPoch: data.KrajPoch || null,
        Phone: data.Phone || null,
        StatusPla: data.StatusPla || null,
        Email: data.Email || null,
        Birthday: data.Birthday || null,
        Notes: data.Notes || null,
        Creator: data.Creator || null,
        Firma: data.Firma || null,
        NumerSprawy: data.NumerSprawy || null,
        DataZloWnio: new Date().toISOString(),
        TotalSpend: "0",
        Doc: "",
        Inspektor: "",
        DataWydWni: null,
        DataOdbKartyPob: "",
        DataOdbDecyzji: "",
        DataZakLegPob: "",
        FormWni: "No",
        ZalNrJed: "No",
        KopiaPasz: "No",
        ZalBlue: "No",
        CzteZdjecia: "No",
        Pelnomocnictwo: "No",
      }

      // Dodanie klienta do bazy danych
      const newClient = await addClient(clientData)

      if (!newClient) {
        throw new Error("Nie udało się dodać klienta")
      }

      // Wywołanie callbacka, jeśli został dostarczony
      if (onClientCreated) {
        onClientCreated(newClient)
      }

      // Komunikat o powodzeniu
      toast({
        title: "Klient dodany",
        description: `${data.Name} został pomyślnie dodany.`,
      })

      // Resetowanie formularza i zamknięcie modalu
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Błąd podczas dodawania klienta:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się dodać klienta. Spróbuj ponownie później.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj nowego klienta</DialogTitle>
          <DialogDescription>
            Wypełnij formularz, aby dodać nowego klienta. Pola oznaczone * są wymagane.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię i nazwisko *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="Status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aktywny">Aktywny</SelectItem>
                        <SelectItem value="Nieaktywny">Nieaktywny</SelectItem>
                        <SelectItem value="W trakcie">W trakcie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="KrajPoch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kraj pochodzenia</FormLabel>
                    <FormControl>
                      <Input placeholder="Polska" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="Email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jan.kowalski@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+48 123 456 789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="CelPobytu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cel pobytu</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz cel pobytu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Praca">Praca</SelectItem>
                        <SelectItem value="Studia">Studia</SelectItem>
                        <SelectItem value="Rodzina">Rodzina</SelectItem>
                        <SelectItem value="Inne">Inne</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="PodLegPob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Podstawa legalnego pobytu</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz podstawę" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Wiza">Wiza</SelectItem>
                        <SelectItem value="Karta pobytu">Karta pobytu</SelectItem>
                        <SelectItem value="Ruch bezwizowy">Ruch bezwizowy</SelectItem>
                        <SelectItem value="Inne">Inne</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="Firma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma</FormLabel>
                    <FormControl>
                      <Input placeholder="Nazwa firmy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="NumerSprawy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numer sprawy</FormLabel>
                    <FormControl>
                      <Input placeholder="S.C.-V.6151.1.12345.2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="Notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notatki</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowe informacje o kliencie..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Dodawanie..." : "Dodaj klienta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

