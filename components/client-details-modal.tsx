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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  Globe,
  Edit,
  XCircle,
  MapPin,
  CreditCard,
  Briefcase,
  FileCheck,
  Clock,
  AlertCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { type Client, updateClient } from "@/lib/superbase"

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
  TotalSpend: z.string().optional(),
  NumerSprawy: z.string().optional(),
  Inspektor: z.string().optional(),
  Firma: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

interface ClientDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onClientUpdated?: (updatedClient: Client) => void
}

export function ClientDetailsModal({ open, onOpenChange, client, onClientUpdated }: ClientDetailsModalProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicjalizacja formularza z danymi klienta
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      Name: "",
      Status: "",
      CelPobytu: "",
      PodLegPob: "",
      KrajPoch: "",
      Phone: "",
      Adres: "",
      StatusPla: "",
      Email: "",
      Birthday: "",
      Notes: "",
      Creator: "",
      TotalSpend: "",
      NumerSprawy: "",
      Inspektor: "",
      Firma: "",
    },
  })

  // Aktualizacja wartości formularza, gdy zmienia się klient
  useEffect(() => {
    if (client) {
      form.reset({
        Name: client.Name || "",
        Status: client.Status || "",
        CelPobytu: client.CelPobytu || "",
        PodLegPob: client.PodLegPob || "",
        KrajPoch: client.KrajPoch || "",
        Phone: client.Phone || "",
        StatusPla: client.StatusPla || "",
        Email: client.Email || "",
        Birthday: client.Birthday || "",
        Notes: client.Notes || "",
        Creator: client.Creator || "",
        TotalSpend: client.TotalSpend || "",
        NumerSprawy: client.NumerSprawy || "",
        Inspektor: client.Inspektor || "",
        Firma: client.Firma || "",
      })
    }
  }, [client, form])

  // Obsługa przesyłania formularza
  async function onSubmit(data: ClientFormValues) {
    if (!client) return

    setIsSubmitting(true)

    try {
      // Aktualizacja klienta w bazie danych
      const updatedClient = await updateClient(client.id, data)

      if (!updatedClient) {
        throw new Error("Nie udało się zaktualizować klienta")
      }

      // Wywołanie callbacka, jeśli został dostarczony
      if (onClientUpdated) {
        onClientUpdated(updatedClient)
      }

      // Komunikat o powodzeniu
      toast({
        title: "Klient zaktualizowany",
        description: `${data.Name} został pomyślnie zaktualizowany.`,
      })

      // Wyjście z trybu edycji
      setIsEditMode(false)
    } catch (error) {
      console.error("Błąd podczas aktualizacji klienta:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować klienta. Spróbuj ponownie później.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Przełączanie trybu edycji
  const toggleEditMode = () => {
    if (isEditMode && client) {
      // Jeśli anulujemy edycję, resetujemy formularz do oryginalnych wartości
      form.reset({
        Name: client.Name || "",
        Status: client.Status || "",
        CelPobytu: client.CelPobytu || "",
        PodLegPob: client.PodLegPob || "",
        KrajPoch: client.KrajPoch || "",
        Phone: client.Phone || "",
        StatusPla: client.StatusPla || "",
        Email: client.Email || "",
        Birthday: client.Birthday || "",
        Notes: client.Notes || "",
        Creator: client.Creator || "",
        TotalSpend: client.TotalSpend || "",
        NumerSprawy: client.NumerSprawy || "",
        Inspektor: client.Inspektor || "",
        Firma: client.Firma || "",
      })
    }
    setIsEditMode(!isEditMode)
  }

  // Obsługa zamknięcia dialogu
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Resetowanie trybu edycji przy zamykaniu
      setIsEditMode(false)
    }
    onOpenChange(open)
  }

  if (!client) return null

  // Formatowanie daty
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Brak danych"

    // Próba parsowania różnych formatów daty
    try {
      // Sprawdzenie, czy data zawiera format GMT
      if (dateString.includes("GMT")) {
        const parts = dateString.split(" ")
        return parts.slice(0, 2).join(" ")
      }

      // Próba parsowania standardowej daty
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString()
      }

      // Jeśli nie udało się sparsować, zwróć oryginalny string
      return dateString
    } catch (error) {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {client.Name || "Brak nazwy"}
            <Badge
              variant={
                client.Status?.toLowerCase() === "aktywny"
                  ? "default"
                  : client.Status?.toLowerCase() === "nieaktywny"
                    ? "secondary"
                    : "outline"
              }
            >
              {client.Status || "Brak statusu"}
            </Badge>

            {/* Przycisk edycji */}
            <Button
              variant="outline"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={toggleEditMode}
              disabled={isSubmitting}
            >
              {isEditMode ? <XCircle className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Numer sprawy: {client.NumerSprawy || "Brak"} | Data złożenia wniosku: {formatDate(client.DataZloWnio)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informacje o kliencie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informacje o kliencie</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="Name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imię i nazwisko</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="Status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
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
                        name="Email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
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
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="CelPobytu"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cel pobytu</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="Firma"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firma</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
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
                            <Textarea {...field} className="min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={toggleEditMode} disabled={isSubmitting}>
                        Anuluj
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Imię i nazwisko</p>
                      <p className="text-sm text-muted-foreground">{client.Name || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{client.Email || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Telefon</p>
                      <p className="text-sm text-muted-foreground">{client.Phone || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Data urodzenia</p>
                      <p className="text-sm text-muted-foreground">{client.Birthday || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Kraj pochodzenia</p>
                      <p className="text-sm text-muted-foreground">{client.KrajPoch || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Firma</p>
                      <p className="text-sm text-muted-foreground">{client.Firma || "Brak danych"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Status płatności</p>
                      <p className="text-sm text-muted-foreground">{client.StatusPla || "Brak danych"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zakładki dla dodatkowych informacji */}
          {!isEditMode && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Szczegóły sprawy</TabsTrigger>
                <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                <TabsTrigger value="notes">Notatki</TabsTrigger>
              </TabsList>

              {/* Zakładka szczegółów sprawy */}
              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Szczegóły sprawy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Numer sprawy</p>
                          <p className="text-sm text-muted-foreground">{client.NumerSprawy || "Brak danych"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Inspektor</p>
                          <p className="text-sm text-muted-foreground">{client.Inspektor || "Brak danych"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Data złożenia wniosku</p>
                          <p className="text-sm text-muted-foreground">{formatDate(client.DataZloWnio)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Data odbioru karty pobytu</p>
                          <p className="text-sm text-muted-foreground">{formatDate(client.DataOdbKartyPob)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Data odbioru decyzji</p>
                          <p className="text-sm text-muted-foreground">{formatDate(client.DataOdbDecyzji)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Data zakończenia legalnego pobytu</p>
                          <p className="text-sm text-muted-foreground">{formatDate(client.DataZakLegPob)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Cel pobytu</p>
                          <p className="text-sm text-muted-foreground">{client.CelPobytu || "Brak danych"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Podstawa legalnego pobytu</p>
                          <p className="text-sm text-muted-foreground">{client.PodLegPob || "Brak danych"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Zakładka dokumentów */}
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Dokumenty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.Doc ? (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Załączone dokumenty:</h3>
                          <div className="space-y-2">
                            {client.Doc.split(",").map((doc, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={doc.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline truncate"
                                >
                                  {doc.trim().split("/").pop() || `Dokument ${index + 1}`}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">Brak załączonych dokumentów</div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Formularz wniosku</p>
                            <p className="text-sm text-muted-foreground">{client.FormWni === "Yes" ? "Tak" : "Nie"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Załącznik nr jedności</p>
                            <p className="text-sm text-muted-foreground">{client.ZalNrJed === "Yes" ? "Tak" : "Nie"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Kopia paszportu</p>
                            <p className="text-sm text-muted-foreground">
                              {client.KopiaPasz === "Yes" ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Załącznik Blue</p>
                            <p className="text-sm text-muted-foreground">{client.ZalBlue === "Yes" ? "Tak" : "Nie"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Cztery zdjęcia</p>
                            <p className="text-sm text-muted-foreground">
                              {client.CzteZdjecia === "Yes" ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Pełnomocnictwo</p>
                            <p className="text-sm text-muted-foreground">
                              {client.Pelnomocnictwo === "Yes" ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Zakładka notatek */}
              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Notatki i uwagi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.Notes ? (
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">Notatki</p>
                          <p className="text-sm text-muted-foreground">
                            Utworzone przez: {client.Creator || "Nieznany"}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-line">{client.Notes}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">Brak notatek dla tego klienta</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>{!isEditMode && <Button onClick={() => onOpenChange(false)}>Zamknij</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

