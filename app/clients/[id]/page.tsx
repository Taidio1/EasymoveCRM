"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Client, getClientById, updateClient, uploadClientDocument, deleteClientDocument, supabase } from "@/lib/superbase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import MainLayout from "@/components/main-layout"
import { toast } from "@/hooks/use-toast"
import { formatDate, getStatusColor, isYes } from "@/lib/utils"
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Briefcase,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  FileCheck,
  Plus,
  Loader2,
  Download,
  Trash2,
} from "lucide-react"

// Schema formularza klienta (skopiowany z client-details-modal.tsx)
const clientFormSchema = z.object({
  Name: z.string().min(2, { message: "Imię i nazwisko musi mieć co najmniej 2 znaki." }),
  Status: z.string().min(1, { message: "Status jest wymagany." }),
  CelPobytu: z.string().optional(),
  PodLegPob: z.string().optional(),
  KrajPoch: z.string().optional(),
  Phone: z.string().optional(),
  Adres: z.string().nullable().optional(),
  StatusPla: z.string().optional(),
  Email: z.string().optional(),
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

type ClientFormValues = z.infer<typeof clientFormSchema>

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Inicjalizacja formularza
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
  
// Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        console.log("Fetching client with ID:", clientId)
        const foundClient = await getClientById(clientId)
        
        console.log("Found client:", foundClient)
        
        if (!foundClient) {
          console.log("Client not found")
          setClient(null)
          setIsLoading(false)
          return
        }
        
        setClient(foundClient)
        
        // Reset form with client data
        form.reset({
          Name: foundClient.Name || "",
          Status: foundClient.Status || "",
          CelPobytu: foundClient.CelPobytu || "none",
          PodLegPob: foundClient.PodLegPob || "none",
          KrajPoch: foundClient.KrajPoch || "",
          Phone: foundClient.Phone || "",
          StatusPla: foundClient.StatusPla || "",
          Email: foundClient.Email || "",
          Birthday: foundClient.Birthday || "",
          Notes: foundClient.Notes || "",
          Creator: foundClient.Creator || "",
          TotalSpend: foundClient.TotalSpend || "",
          NumerSprawy: foundClient.NumerSprawy || "",
          Inspektor: foundClient.Inspektor || "",
          Firma: foundClient.Firma || "",
          DataZloWnio: foundClient.DataZloWnio || "",
          DataWydWni: foundClient.DataWydWni || "",
          DataOdbKartyPob: foundClient.DataOdbKartyPob || "",
          DataOdbDecyzji: foundClient.DataOdbDecyzji || "",
          DataZakLegPob: foundClient.DataZakLegPob || "",
          FormWni: isYes(foundClient.FormWni),
          ZalNrJed: isYes(foundClient.ZalNrJed),
          KopiaPasz: isYes(foundClient.KopiaPasz),
          ZalBlue: isYes(foundClient.ZalBlue),
          CzteZdjecia: isYes(foundClient.CzteZdjecia),
          Pelnomocnictwo: isYes(foundClient.Pelnomocnictwo),
        })
      } catch (error) {
        console.error("Błąd podczas pobierania klienta:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać danych klienta.",
          variant: "destructive"
        })
        setClient(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClient()
  }, [clientId])
  
  // Obsługa zapisu zmian
  const handleSave = async (data: ClientFormValues) => {
    if (!client) return
    
    setIsSubmitting(true)
    
    try {
      const { StatusPla, ...dataWithoutStatusPla } = data
      const processedData = {
        ...dataWithoutStatusPla,
        CelPobytu: data.CelPobytu === "none" ? null : data.CelPobytu,
        PodLegPob: data.PodLegPob === "none" ? null : data.PodLegPob,
        DataZloWnio: data.DataZloWnio || null,
        DataWydWni: data.DataWydWni || null,
        DataOdbKartyPob: data.DataOdbKartyPob || null,
        DataOdbDecyzji: data.DataOdbDecyzji || null,
        DataZakLegPob: data.DataZakLegPob || null,
        Email: data.Email || null,
        Phone: data.Phone || null,
        KrajPoch: data.KrajPoch || null,
        Birthday: data.Birthday || null,
        Notes: data.Notes || null,
        Inspektor: data.Inspektor || null,
        NumerSprawy: data.NumerSprawy || null,
        Adres: data.Adres || null,
        FormWni: data.FormWni,
        ZalNrJed: data.ZalNrJed,
        KopiaPasz: data.KopiaPasz,
        ZalBlue: data.ZalBlue,
        CzteZdjecia: data.CzteZdjecia,
        Pelnomocnictwo: data.Pelnomocnictwo,
      }
      
      const updatedClient = await updateClient(client.id, processedData)
      
      if (!updatedClient) {
        throw new Error("Nie udało się zaktualizować klienta")
      }
      
      setClient(updatedClient)
      
      toast({
        title: "Klient zaktualizowany",
        description: `${data.Name} został pomyślnie zaktualizowany.`,
      })
      
      setIsEditMode(false)
    } catch (error) {
      console.error("Błąd podczas aktualizacji:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować klienta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Upload plików
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !client?.id) return
    
    setIsUploading(true)
    
    try {
      let uploadedUrls = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Błąd",
            description: `Plik "${file.name}" jest zbyt duży. Maksymalny rozmiar to 10MB.`,
            variant: "destructive",
          })
          continue
        }
        
        const fileType = file.type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if (!allowedTypes.includes(fileType)) {
          toast({
            title: "Błąd",
            description: `Plik "${file.name}" ma nieprawidłowy format. Dozwolone formaty to PDF i Word.`,
            variant: "destructive",
          })
          continue
        }
        
        const fileUrl = await uploadClientDocument(client.id, file)
        
        if (fileUrl) {
          uploadedUrls.push(fileUrl)
        }
      }
      
      if (uploadedUrls.length > 0) {
        const currentDocs = client.Doc || ""
        const updatedDocs = currentDocs 
          ? currentDocs + ',' + uploadedUrls.join(',')
          : uploadedUrls.join(',')
        
        const updatedClient = await updateClient(client.id, { Doc: updatedDocs })
        setClient(updatedClient)
        
        toast({
          title: "Sukces",
          description: `Wgrano pomyślnie ${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'dokument' : 'dokumenty'}.`,
        })
      }
    } catch (error) {
      console.error("Błąd podczas wgrywania pliku:", error)
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas wgrywania dokumentu.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }
  
  // Usuwanie dokumentu
  const handleDeleteDocument = async (docUrl: string) => {
    if (!client) return
    
    setIsUploading(true)
    
    try {
      const filePath = decodeURIComponent(docUrl.split('/documents/')[1])
      const success = await deleteClientDocument(filePath)
      
      if (success) {
        const currentDocs = client.Doc?.split(',').filter(url => url.trim() !== docUrl.trim()).join(',') || ""
        const updatedClient = await updateClient(client.id, { Doc: currentDocs })
        setClient(updatedClient)
        
        toast({
          title: "Dokument usunięty",
          description: "Dokument został pomyślnie usunięty."
        })
      }
    } catch (error) {
      console.error("Błąd podczas usuwania dokumentu:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dokumentu.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Pobieranie dokumentu
  const handleDownloadDocument = async (docUrl: string) => {
    try {
      setIsUploading(true)
      
      const publicUrlPart = 'public/documents/'
      const filePath = docUrl.includes(publicUrlPart)
        ? docUrl.split(publicUrlPart)[1]
        : docUrl.split('/documents/')[1]
      
      if (!filePath) {
        throw new Error("Nie można wyodrębnić ścieżki pliku z URL")
      }
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath)
      
      if (error) throw error
      if (!data) throw new Error("Brak danych w odpowiedzi")
      
      const fileName = filePath.split('/').pop() || "dokument.pdf"
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Pobieranie rozpoczęte",
        description: "Rozpoczęto pobieranie dokumentu.",
      })
    } catch (error) {
      console.error("Błąd podczas pobierania dokumentu:", error)
      toast({
        title: "Błąd",
        description: `Nie udało się pobrać dokumentu.`,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          Ładowanie...
        </div>
      </MainLayout>
    )
  }
  
  if (!client) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy klientów
          </Button>
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Nie znaleziono klienta
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header z przyciskiem powrót */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy klientów
          </Button>
          
          {/* Przyciski Edytuj/Zapisz */}
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditMode(false)}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Anuluj
              </Button>
              <Button 
                onClick={form.handleSubmit(handleSave)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Zapisz zmiany
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Tytuł z Badge */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {client.Name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {client.NumerSprawy || "Brak numeru sprawy"} | {formatDate(client.DataZloWnio)}
            </p>
          </div>
          <Badge className={getStatusColor(client.Status)}>
            {client.Status}
          </Badge>
        </div>
        
        <Separator />
        
        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Szczegóły sprawy</TabsTrigger>
            <TabsTrigger value="documents">Dokumenty</TabsTrigger>
            <TabsTrigger value="notes">Notatki</TabsTrigger>
          </TabsList>
          
{/* Zakładka Szczegóły */}
          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Sekcja 1: Dane personalne */}
<Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isEditMode ? "Edycja danych personalnych" : "Dane personalne"}
                </CardTitle>
              </CardHeader>
              <CardContent>
{isEditMode ? (
                  <Form {...form}>
                    <form className="space-y-4">
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
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Imię i nazwisko</p>
                        <p className="text-sm text-muted-foreground">{client.Name || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{client.Email || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telefon</p>
                        <p className="text-sm text-muted-foreground">{client.Phone || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data urodzenia</p>
                        <p className="text-sm text-muted-foreground">{client.Birthday || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Kraj pochodzenia</p>
                        <p className="text-sm text-muted-foreground">{client.KrajPoch || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Firma</p>
                        <p className="text-sm text-muted-foreground">{client.Firma || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Sekcja 2: Informacje o sprawie */}
<Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isEditMode ? "Edycja informacji o sprawie" : "Informacje o sprawie"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Form {...form}>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  <SelectItem value="Zakończony">Zakończony</SelectItem>
                                  <SelectItem value="Zawieszony">Zawieszony</SelectItem>
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
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Badge className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">{client.Status || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Numer sprawy</p>
                        <p className="text-sm text-muted-foreground">{client.NumerSprawy || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Inspektor</p>
                        <p className="text-sm text-muted-foreground">{client.Inspektor || "-"}</p>
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
                        <p className="text-sm text-muted-foreground">{client.CelPobytu || "-"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Podstawa legalnego pobytu</p>
                        <p className="text-sm text-muted-foreground">{client.PodLegPob || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Zakładka Dokumenty */}
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
                          const docUrl = doc.trim()
                          if (!docUrl) return null
                          
                          const fileName = docUrl.split("/").pop() || `Dokument ${index + 1}`
                          
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
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Brak załączonych dokumentów. Kliknij "Dodaj dokument", aby wgrać pierwszy plik.
                    </div>
                  )}
                  
{isEditMode ? (
                    <Form {...form}>
                      <div className="space-y-2 mt-6">
                        <FormLabel>Status dokumentów</FormLabel>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Formularz wniosku
                                  </FormLabel>
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Załącznik nr jedności
                                  </FormLabel>
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Kopia paszportu
                                  </FormLabel>
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Załącznik Blue
                                  </FormLabel>
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Cztery zdjęcia
                                  </FormLabel>
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
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Pełnomocnictwo
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </Form>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Zakładka Notatki */}
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notatki i uwagi</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="Notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notatki</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[200px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                ) : client.Notes ? (
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
                  <div className="text-center py-4 text-muted-foreground">
                    Brak notatek dla tego klienta
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
