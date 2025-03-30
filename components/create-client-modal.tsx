"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { type Client, addClient } from "@/lib/superbase"
import { useAuth } from "@/hooks/use-auth"

// Schemat formularza klienta
const clientFormSchema = z.object({
  Name: z.string().min(2, {
    message: "ImiÄ i nazwisko musi mieÄ co najmniej 2 znaki.",
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
      message: "WprowadÅº prawidÅowy adres email.",
    })
    .optional(),
  Birthday: z.string().optional(),
  Notes: z.string().optional(),
  Creator: z.string().optional(),
  DataZloWnio: z.string().optional(),
  FormWni: z.boolean().default(false),
  ZalNrJed: z.boolean().default(false),
  KopiaPasz: z.boolean().default(false),
  ZalBlue: z.boolean().default(false),
  CzteZdjecia: z.boolean().default(false),
  Pelnomocnictwo: z.boolean().default(false),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

interface CreateClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: (client: Client) => void
}

export function CreateClientModal({ open, onOpenChange, onClientCreated }: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth() // Pobieranie informacji o zalogowanym uÅ¼ytkowniku

  // Inicjalizacja formularza z wartoÅciami domyÅlnymi
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
      DataZloWnio: "",
      FormWni: false,
      ZalNrJed: false,
      KopiaPasz: false,
      ZalBlue: false,
      CzteZdjecia: false,
      Pelnomocnictwo: false,
    },
  })

  // ObsÅuga przesyÅania formularza
  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true)
    console.log("Rozpoczynam dodawanie klienta:", data);

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
        Creator: user?.email || null, // Automatyczne przypisanie aktualnego uÅ¼ytkownika
        // Formatowanie DataZloWnio tylko jeÅli zostaÅa podana
        DataZloWnio: data.DataZloWnio ? new Date(data.DataZloWnio).toISOString() : null,
        // Formatowanie CreatedTime do jednolitego formatu
        CreatedDate: new Date().toISOString(),
        TotalSpend: "0",
        Doc: "",
        NumerSprawy: null,
        Firma: null,
        Inspektor: "",
        DataWydWni: null,
        DataOdbKartyPob: "",
        DataOdbDecyzji: "",
        DataZakLegPob: "",
        FormWni: data.FormWni ? "Yes" : "No",
        ZalNrJed: data.ZalNrJed ? "Yes" : "No",
        KopiaPasz: data.KopiaPasz ? "Yes" : "No",
        ZalBlue: data.ZalBlue ? "Yes" : "No",
        CzteZdjecia: data.CzteZdjecia ? "Yes" : "No",
        Pelnomocnictwo: data.Pelnomocnictwo ? "Yes" : "No",
      }

      console.log("WysyÅanie danych klienta:", clientData);

      // Dodanie klienta do bazy danych
      console.log("Przed wywoÅaniem addClient...");
      const newClient = await addClient(clientData)
      console.log("Po wywoÅaniu addClient, rezultat:", newClient);

      if (!newClient) {
        console.error("Nie otrzymano danych nowego klienta");
        throw new Error("Nie udaÅo siÄ dodaÄ klienta")
      }

      // WywoÅanie callbacka, jeÅli zostaÅ dostarczony
      if (onClientCreated) {
        onClientCreated(newClient)
      }

      // Komunikat o powodzeniu
      toast({
        title: "Klient dodany",
        description: `${data.Name} zostaÅ pomyÅlnie dodany.`,
      })

      // Resetowanie formularza i zamkniÄcie modalu
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("SzczegÃ³Åowy bÅÄd podczas dodawania klienta:", error)
      toast({
        title: "BÅÄd",
        description: "Nie udaÅo siÄ dodaÄ klienta. SprÃ³buj ponownie pÃ³Åºniej.",
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
            WypeÅnij formularz, aby dodaÄ nowego klienta. Pola oznaczone * sÄ wymagane.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ImiÄ i nazwisko *</FormLabel>
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
                name="DataZloWnio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data zÅoÅ¼enia wniosku</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data urodzenia</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                          <SelectValue placeholder="Wybierz podstawÄ" />
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

            <div className="space-y-2">
              <FormLabel>Dokumenty</FormLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="FormWni"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Formularz wniosku</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ZalNrJed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">ZaÅÄcznik nr 1</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="KopiaPasz"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Kopia paszportu</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ZalBlue"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Niebieska karta</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="CzteZdjecia"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">4 zdjÄcia</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="Pelnomocnictwo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">PeÅnomocnictwo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

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

