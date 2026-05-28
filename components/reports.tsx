"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { FileText, Users, BarChart, Search, Loader2 } from "lucide-react"
import { PdfPreview } from "./pdf-preview"
import { getClients, type Client } from "@/lib/superbase"
import { documentGenerators, type DocumentType } from "@/lib/pdf-generator"
import { FormGenerator } from "./form-generator"
import { AdsAnalytics } from "./ads-analytics"

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("clientCard")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)
      } catch (error) {
        console.error("Błąd podczas pobierania klientów:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać listy klientów.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(
        (client) =>
          client.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.NumerSprawy?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, clients])

  const generateSingleDocument = async () => {
    if (!selectedClient) {
      toast({ title: "Brak klienta", description: "Wybierz klienta, aby wygenerować dokument.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const generator = documentGenerators[selectedDocType]
      const doc = (generator as any)(selectedClient)
      setPdfPreviewUrl(doc.output("dataurlstring"))
    } catch (error) {
      console.error("Błąd podczas generowania dokumentu:", error)
      toast({ title: "Błąd", description: "Nie udało się wygenerować dokumentu.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateClientsList = async () => {
    if (selectedClients.length === 0) {
      toast({ title: "Brak wybranych klientów", description: "Wybierz co najmniej jednego klienta.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const selectedClientsList = clients.filter((client) => selectedClients.includes(client.id))
      const doc = documentGenerators.clientsList(selectedClientsList)
      setPdfPreviewUrl(doc.output("dataurlstring"))
    } catch (error) {
      console.error("Błąd podczas generowania listy klientów:", error)
      toast({ title: "Błąd", description: "Nie udało się wygenerować listy klientów.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateStatisticsReport = async () => {
    setIsGenerating(true)
    try {
      const doc = documentGenerators.statisticsReport(clients)
      setPdfPreviewUrl(doc.output("dataurlstring"))
    } catch (error) {
      console.error("Błąd podczas generowania raportu statystycznego:", error)
      toast({ title: "Błąd", description: "Nie udało się wygenerować raportu statystycznego.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClientSelect = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    )
  }

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map((client) => client.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Raporty</h1>
        <p className="text-muted-foreground">Analityka kampanii i generowanie dokumentów</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analityka strony</TabsTrigger>
          <TabsTrigger value="documents">Dokumenty klienta</TabsTrigger>
          <TabsTrigger value="lists">Listy klientów</TabsTrigger>
          <TabsTrigger value="statistics">Statystyki</TabsTrigger>
          <TabsTrigger value="forms">Formularze urzędowe</TabsTrigger>
        </TabsList>

        {/* Zakładka analityki Google Ads */}
        <TabsContent value="analytics" className="space-y-4">
          <AdsAnalytics />
        </TabsContent>

        {/* Zakładka dokumentów klienta */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generowanie dokumentów dla klienta</CardTitle>
              <CardDescription>Wybierz klienta i rodzaj dokumentu, aby wygenerować dokument PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-search">Wyszukaj klienta</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client-search"
                    placeholder="Wpisz imię, nazwisko, email lub numer sprawy..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Wybierz klienta</Label>
                <div className="border rounded-md h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nie znaleziono klientów
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 cursor-pointer hover:bg-accent ${selectedClient?.id === client.id ? "bg-accent" : ""}`}
                          onClick={() => setSelectedClient(client)}
                        >
                          <div className="font-medium">{client.Name || "Brak nazwy"}</div>
                          <div className="text-sm text-muted-foreground">
                            {client.Email || "Brak email"} | {client.NumerSprawy || "Brak numeru sprawy"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type">Rodzaj dokumentu</Label>
                <Select value={selectedDocType} onValueChange={(value) => setSelectedDocType(value as DocumentType)}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Wybierz rodzaj dokumentu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clientCard">Karta klienta</SelectItem>
                    <SelectItem value="temporaryResidenceApplication">Wniosek o pobyt czasowy</SelectItem>
                    <SelectItem value="powerOfAttorney">Pełnomocnictwo</SelectItem>
                    <SelectItem value="registrationCertificate">Zaświadczenie o zameldowaniu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={generateSingleDocument} disabled={!selectedClient || isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generowanie...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" />Generuj dokument</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zakładka list klientów */}
        <TabsContent value="lists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generowanie list klientów</CardTitle>
              <CardDescription>Wybierz klientów, aby wygenerować listę w formacie PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Wybierz klientów</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                    {selectedClients.length === filteredClients.length ? "Odznacz wszystkich" : "Zaznacz wszystkich"}
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtruj klientów..."
                    className="pl-8 mb-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="border rounded-md h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nie znaleziono klientów
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredClients.map((client) => (
                        <div key={client.id} className="p-3 flex items-center hover:bg-accent">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => handleClientSelect(client.id)}
                            className="mr-3"
                          />
                          <label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{client.Name || "Brak nazwy"}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.Status || "Brak statusu"} | {client.NumerSprawy || "Brak numeru sprawy"}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Wybrano {selectedClients.length} z {filteredClients.length} klientów
                </div>
              </div>

              <Button className="w-full" onClick={generateClientsList} disabled={selectedClients.length === 0 || isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generowanie...</>
                ) : (
                  <><Users className="mr-2 h-4 w-4" />Generuj listę klientów</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zakładka statystyk */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raport statystyczny</CardTitle>
              <CardDescription>Generuj raport statystyczny na podstawie danych klientów</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>Raport statystyczny zawiera następujące informacje:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Łączna liczba klientów</li>
                  <li>Podział klientów według statusu</li>
                  <li>Najczęstsze kraje pochodzenia klientów</li>
                  <li>Najczęstsze cele pobytu</li>
                  <li>Statystyki miesięczne nowych klientów</li>
                </ul>
              </div>

              <Button className="w-full" onClick={generateStatisticsReport} disabled={isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generowanie...</>
                ) : (
                  <><BarChart className="mr-2 h-4 w-4" />Generuj raport statystyczny</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zakładka formularzy urzędowych */}
        <TabsContent value="forms" className="space-y-4">
          <FormGenerator clients={clients} />
        </TabsContent>
      </Tabs>

      {pdfPreviewUrl && <PdfPreview pdfData={pdfPreviewUrl} onClose={() => setPdfPreviewUrl(null)} />}
    </div>
  )
}
