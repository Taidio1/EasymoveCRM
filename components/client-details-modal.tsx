"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
  Plus,
  Loader2,
  Trash2,
  Download,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { type Client, supabase, updateClient, uploadClientDocument, deleteClientDocument } from "@/lib/superbase"
import { clientFormSchema, type ClientFormValues } from "@/lib/client-schema"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/use-auth"

interface ClientDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onClientUpdated?: (updatedClient: Client) => void
  isEditMode?: boolean
  onEditModeChange?: (isEditMode: boolean) => void
}

export function ClientDetailsModal({ 
  open, 
  onOpenChange, 
  client, 
  onClientUpdated,
  isEditMode: externalIsEditMode,
  onEditModeChange: externalOnEditModeChange 
}: ClientDetailsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(externalIsEditMode || false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Aktualizacja lokalnego stanu edycji, gdy zmienia się zewnętrzny
  useEffect(() => {
    if (externalIsEditMode !== undefined) {
      setIsEditMode(externalIsEditMode)
    }
  }, [externalIsEditMode])

  // Aktualizacja zewnętrznego stanu edycji, gdy zmienia się lokalny
  const handleEditModeChange = (newIsEditMode: boolean) => {
    setIsEditMode(newIsEditMode)
    if (externalOnEditModeChange) {
      externalOnEditModeChange(newIsEditMode)
    }
  }

  // Resetowanie trybu edycji przy zamknięciu modalu
  useEffect(() => {
    if (!open) {
      handleEditModeChange(false)
    }
  }, [open])

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
      DataZloWnio: "",
      DataWydWni: "",
      DataOdbKartyPob: "",
      DataOdbDecyzji: "",
      DataZakLegPob: "",
      FormWni: false,
      ZalNrJed: false,
      KopiaPasz: false,
      ZalBlue: false,
      CzteZdjecia: false,
      Pelnomocnictwo: false,
    },
  })

  // Aktualizacja wartości formularza, gdy zmienia się klient
  useEffect(() => {
    if (client) {
      form.reset({
        Name: client.Name || "",
        Status: client.Status || "",
        CelPobytu: client.CelPobytu || "none",
        PodLegPob: client.PodLegPob || "none",
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
        DataZloWnio: client.DataZloWnio || "",
        DataWydWni: client.DataWydWni || "",
        DataOdbKartyPob: client.DataOdbKartyPob || "",
        DataOdbDecyzji: client.DataOdbDecyzji || "",
        DataZakLegPob: client.DataZakLegPob || "",
        FormWni: isYes(client.FormWni),
        ZalNrJed: isYes(client.ZalNrJed),
        KopiaPasz: isYes(client.KopiaPasz),
        ZalBlue: isYes(client.ZalBlue),
        CzteZdjecia: isYes(client.CzteZdjecia),
        Pelnomocnictwo: isYes(client.Pelnomocnictwo),
      })
    }
  }, [client, form])

  // Debugowanie danych dokumentów
  useEffect(() => {
    if (client) {
      console.log("Dane dokumentów w komponencie (useEffect):", {
        FormWni: client.FormWni,
        ZalNrJed: client.ZalNrJed, 
        KopiaPasz: client.KopiaPasz,
        ZalBlue: client.ZalBlue,
        CzteZdjecia: client.CzteZdjecia,
        Pelnomocnictwo: client.Pelnomocnictwo,
        "typeof FormWni": typeof client.FormWni
      });
    }
  }, [client]);

  // Obsługa przesyłania formularza
  async function onSubmit(data: ClientFormValues) {
    if (!client) return

    setIsSubmitting(true)

    try {
      // Przygotuj dane z poprawną obsługą wartości "none" i pustych stringów
      const { StatusPla, ...dataWithoutStatusPla } = data;
      const processedData = {
        ...dataWithoutStatusPla,
        CelPobytu: data.CelPobytu === "none" ? null : data.CelPobytu,
        PodLegPob: data.PodLegPob === "none" ? null : data.PodLegPob,
        // Konwersja pustych stringów na null dla pól dat
        DataZloWnio: data.DataZloWnio || null,
        DataWydWni: data.DataWydWni || null,
        DataOdbKartyPob: data.DataOdbKartyPob || null,
        DataOdbDecyzji: data.DataOdbDecyzji || null,
        DataZakLegPob: data.DataZakLegPob || null,
        // Konwersja pustych stringów na null dla innych pól
        Email: data.Email || null,
        Phone: data.Phone || null,
        KrajPoch: data.KrajPoch || null,
        Birthday: data.Birthday || null,
        Notes: data.Notes || null,
        Inspektor: data.Inspektor || null,
        NumerSprawy: data.NumerSprawy || null,
        Adres: data.Adres || null,
        // Pola boolean pozostają bez zmian
        FormWni: data.FormWni,
        ZalNrJed: data.ZalNrJed,
        KopiaPasz: data.KopiaPasz,
        ZalBlue: data.ZalBlue,
        CzteZdjecia: data.CzteZdjecia,
        Pelnomocnictwo: data.Pelnomocnictwo,
      }

      console.log("Wysyłanie danych do aktualizacji:", processedData);
      console.log("Dane dokumentów:", {
        FormWni: processedData.FormWni,
        ZalNrJed: processedData.ZalNrJed,
        KopiaPasz: processedData.KopiaPasz,
        ZalBlue: processedData.ZalBlue,
        CzteZdjecia: processedData.CzteZdjecia,
        Pelnomocnictwo: processedData.Pelnomocnictwo,
      });

      // Aktualizacja klienta w bazie danych
      console.log("Dane przed wysłaniem do updateClient:", processedData);
      console.log("Client ID:", client.id);
      
      let updatedClient;
      try {
        updatedClient = await updateClient(client.id, processedData);
      } catch (updateError) {
        console.error("Szczegółowy błąd updateClient:", updateError);
        console.error("Kod błędu:", (updateError as any)?.code);
        console.error("Wiadomość błędu:", (updateError as any)?.message);
        console.error("Szczegóły błędu:", (updateError as any)?.details);
        throw new Error(`Błąd aktualizacji: ${(updateError as any)?.message || 'Nieznany błąd'}`);
      }

      if (!updatedClient) {
        throw new Error("Nie udało się zaktualizować klienta - brak danych z serwera")
      }

      console.log("Zaktualizowany klient otrzymany z bazy:", updatedClient);
      console.log("Dane dokumentów po aktualizacji:", {
        FormWni: updatedClient.FormWni,
        ZalNrJed: updatedClient.ZalNrJed,
        KopiaPasz: updatedClient.KopiaPasz,
        ZalBlue: updatedClient.ZalBlue,
        CzteZdjecia: updatedClient.CzteZdjecia,
        Pelnomocnictwo: updatedClient.Pelnomocnictwo,
      });

      // Wywołanie callbacka, jeśli został dostarczony
      if (onClientUpdated) {
        // Przekaż zaktualizowany klient bez dodatkowych konwersji
        const normalizedClient = {
          ...updatedClient,
        };
        
        onClientUpdated(normalizedClient);
      }

      // Komunikat o powodzeniu
      toast({
        title: "Klient zaktualizowany",
        description: `${data.Name} został pomyślnie zaktualizowany.`,
      })

      // Wyjście z trybu edycji
      handleEditModeChange(false)
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

  // Dodaj funkcję do obsługi wgrywania plików
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !client?.id) return;

    setIsUploading(true);
    
    try {
      let uploadedUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Sprawdzenie rozmiaru pliku (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Błąd",
            description: `Plik "${file.name}" jest zbyt duży. Maksymalny rozmiar to 10MB.`,
            variant: "destructive",
          });
          continue;
        }
        
        // Sprawdzenie typu pliku
        const fileType = file.type;
        const allowedTypes = [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(fileType)) {
          toast({
            title: "Błąd",
            description: `Plik "${file.name}" ma nieprawidłowy format. Dozwolone formaty to PDF i Word.`,
            variant: "destructive",
          });
          continue;
        }
        
        // Wgraj plik i pobierz URL
        const fileUrl = await uploadClientDocument(client.id, file);
        
        if (fileUrl) {
          uploadedUrls.push(fileUrl);
        }
      }
      
      // Aktualizuj klienta, dodając nowe dokumenty do istniejącej listy
      if (uploadedUrls.length > 0) {
        const currentDocs = client.Doc || "";
        const updatedDocs = currentDocs 
          ? currentDocs + ',' + uploadedUrls.join(',') 
          : uploadedUrls.join(',');
        
        // Aktualizacja klienta z nowymi URL-ami dokumentów
        const updatedClient = await updateClient(client.id, { Doc: updatedDocs });
        
        // Powiadom rodzica o aktualizacji
        if (onClientUpdated) {
          onClientUpdated(updatedClient);
        }
        
        toast({
          title: "Sukces",
          description: `Wgrano pomyślnie ${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'dokument' : 'dokumenty'}.`,
        });
      }
    } catch (error) {
      console.error("Błąd podczas wgrywania pliku:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas wgrywania dokumentu.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Zresetuj input plików
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Dodaj funkcję usuwania dokumentu
  const handleDeleteDocument = async (docUrl: string) => {
    if (!client) return;
    
    setIsUploading(true); // Możemy wykorzystać ten stan do blokowania UI podczas usuwania
    
    try {
      // Wyciągnij ścieżkę pliku z URL
      const filePath = decodeURIComponent(docUrl.split('/documents/')[1]);
      
      // Wywołaj funkcję usuwającą z Supabase
      const success = await deleteClientDocument(filePath);
      
      if (success) {
        // Aktualizacja obiektu klienta - usunięcie URL z listy dokumentów
        const currentDocs = client.Doc?.split(',').filter(url => url.trim() !== docUrl.trim()).join(',') || "";
        
        // Aktualizacja klienta w bazie danych
        const updatedClient = await updateClient(client.id, { Doc: currentDocs });
        
        // Aktualizacja UI
        if (onClientUpdated && updatedClient) {
          onClientUpdated(updatedClient);
        }
        
        toast({
          title: "Dokument usunięty",
          description: "Dokument został pomyślnie usunięty."
        });
      } else {
        throw new Error("Nie udało się usunąć dokumentu");
      }
    } catch (error) {
      console.error("Błąd podczas usuwania dokumentu:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentu.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Funkcja pomocnicza do pobierania dokumentu
  const handleDownloadDocument = async (docUrl: string) => {
    try {
      setIsUploading(true);
      
      // Wyciągnij ścieżkę pliku z URL
      // Przykład: https://yklzzuoniimpqjqqymlu.supabase.co/storage/v1/object/public/documents/folder/file.pdf
      // Potrzebujemy części "folder/file.pdf"
      const publicUrlPart = 'public/documents/';
      const filePath = docUrl.includes(publicUrlPart) 
        ? docUrl.split(publicUrlPart)[1] 
        : docUrl.split('/documents/')[1];
      
      if (!filePath) {
        throw new Error("Nie można wyodrębnić ścieżki pliku z URL");
      }
      
      console.log("Próba pobrania pliku:", filePath);
      
      // Pobierz URL do pobrania
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      
      if (error) {
        console.error("Błąd Supabase przy pobieraniu pliku:", error);
        throw new Error(`Błąd pobierania: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Brak danych w odpowiedzi");
      }
      
      // Pobierz nazwę pliku
      const fileName = filePath.split('/').pop() || "dokument.pdf";
      
      // Utwórz URL obiektu i inicjuj pobieranie
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Posprzątaj
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Pobieranie rozpoczęte",
        description: "Rozpoczęto pobieranie dokumentu.",
      });
    } catch (error) {
      console.error("Błąd podczas pobierania dokumentu:", error);
      toast({
        title: "Błąd",
        description: `Nie udało się pobrać dokumentu: ${error instanceof Error ? error.message : 'Nieznany błąd'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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

  // Utwórz pomocniczą funkcję do sprawdzania wartości "Yes" 
  const isYes = (value: any): boolean => {
    if (value === true || value === "true") return true;
    if (typeof value === "string" && (value.toLowerCase() === "yes" || value === "Yes")) return true;
    if (value === 1 || value === "1") return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              className="ml-auto h-8 w-8 p-2"
              onClick={() => handleEditModeChange(!isEditMode)}
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
                            <FormLabel>Cel Pobytu</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Wybierz Cel Pobytu" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Brak</SelectItem>
                                <SelectItem value="Praca">Praca</SelectItem>
                                <SelectItem value="Nauka">Nauka</SelectItem>
                                <SelectItem value="Rodzina">Rodzina</SelectItem>
                                <SelectItem value="BlueCard">Blue Card</SelectItem>
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
                            <FormLabel>Podstawa Legalnego Pobytu</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Wybierz Pods. Legalnego Pobytu" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Brak</SelectItem>
                                <SelectItem value="Wiza">Wiza</SelectItem>
                                <SelectItem value="WizaPracownicza">Wiza Pracownicza</SelectItem>
                                <SelectItem value="WizaStudencka">Wiza Studencka</SelectItem>
                                <SelectItem value="KartaPobytu">Karta Pobytu</SelectItem>
                                <SelectItem value="Inne">Inne</SelectItem>
                              </SelectContent>
                            </Select>
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

                      <FormField
                        control={form.control}
                        name="Inspektor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inspektor</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DataZloWnio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data złożenia wniosku</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DataWydWni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data wydania wniosku</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DataOdbKartyPob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data odbioru karty pobytu</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DataOdbDecyzji"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data odbioru decyzji</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="DataZakLegPob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data zakończenia legalnego pobytu</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                              <div>
                                <FormLabel className="font-normal">Formularz wniosku</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
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
                              <div>
                                <FormLabel className="font-normal">Załącznik nr 1</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
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
                              <div>
                                <FormLabel className="font-normal">Kopia paszportu</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
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
                              <div>
                                <FormLabel className="font-normal">Niebieska karta</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
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
                              <div>
                                <FormLabel className="font-normal">4 zdjęcia</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
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
                              <div>
                                <FormLabel className="font-normal">Pełnomocnictwo</FormLabel>
                                <p className="text-xs text-muted-foreground">{field.value ? "Tak" : "Nie"}</p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => handleEditModeChange(false)} disabled={isSubmitting}>
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
                <TabsTrigger value="details">Szczegóły</TabsTrigger>
                <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                <TabsTrigger value="notes">Notatki</TabsTrigger>
              </TabsList>

              {/* Zakładka szczegółów sprawy */}
              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Szczegóły</CardTitle>
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
                          <p className="text-sm font-medium">Data wydania wniosku</p>
                          <p className="text-sm text-muted-foreground">{formatDate(client.DataWydWni)}</p>
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
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Dokumenty</CardTitle>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          multiple
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wgrywanie...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Dodaj dokument
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.Doc ? (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Załączone dokumenty:</h3>
                          <div className="space-y-2">
                            {client.Doc.split(",").map((doc, index) => {
                              const docUrl = doc.trim();
                              if (!docUrl) return null; // Pomiń puste wartości
                              
                              const fileName = docUrl.split("/").pop() || `Dokument ${index + 1}`;
                              
                              return (
                                <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="text-sm truncate">{fileName}</span>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDownloadDocument(docUrl)}
                                      title="Pobierz dokument"
                                      className="h-8 w-8"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeleteDocument(docUrl)}
                                      title="Usuń dokument"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      disabled={isUploading}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Brak załączonych dokumentów. Kliknij "Dodaj dokument", aby wgrać pierwszy plik.
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Formularz wniosku</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.FormWni) ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Załącznik nr jedności</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.ZalNrJed) ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Kopia paszportu</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.KopiaPasz) ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Załącznik Blue</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.ZalBlue) ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Cztery zdjęcia</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.CzteZdjecia) ? "Tak" : "Nie"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Pełnomocnictwo</p>
                            <p className="text-sm text-muted-foreground">
                              {isYes(client.Pelnomocnictwo) ? "Tak" : "Nie"}
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

