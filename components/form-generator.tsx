"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { FileText, Download, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { getClients, type Client } from "@/lib/superbase"
import { downloadFilledForm } from "@/lib/pdf-form-filler"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// URL do formularza PDF (w prawdziwej aplikacji powinien być hostowany na serwerze)
const FORM_PDF_URL = "/forms/wniosek_pobyt_czasowy.pdf"

interface FormGeneratorProps {
  clients: Client[]
}

export function FormGenerator({ clients }: FormGeneratorProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle")

  // Dodaj testowego klienta do listy
  const allClients = [...clients]

  const handleGenerateForm = async () => {
    try {
      setIsGenerating(true)
      setFormStatus("idle")

      // Znajdź wybranego klienta
      const selectedClient = allClients.find((client) => client.id === selectedClientId)

      if (!selectedClient) {
        toast({
          title: "Błąd",
          description: "Wybierz klienta, aby wygenerować formularz.",
          variant: "destructive",
        })
        return
      }

      // Pobierz wypełniony formularz
      await downloadFilledForm(
        selectedClient,
        FORM_PDF_URL,
        `wniosek_pobyt_czasowy_${selectedClient.Name?.replace(/\s+/g, "_")}.pdf`,
      )

      setFormStatus("success")
      toast({
        title: "Sukces",
        description: "Formularz zastępczy został wygenerowany i pobrany.",
      })
    } catch (error) {
      console.error("Błąd podczas generowania formularza:", error)
      setFormStatus("error")
      toast({
        title: "Błąd",
        description: "Wystąpił problem podczas generowania formularza zastępczego.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generator formularzy urzędowych</CardTitle>
        <CardDescription>Wypełnij oficjalne formularze urzędowe danymi klienta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Brak pliku formularza</AlertTitle>
          <AlertDescription>
            Nie znaleziono pliku formularza PDF. Aby korzystać z generatora formularzy, umieść oficjalny plik PDF
            formularza w katalogu <code>public/forms/wniosek_pobyt_czasowy.pdf</code>.
            <br />
            Obecnie system wygeneruje dokument zastępczy z danymi klienta.
          </AlertDescription>
        </Alert>

        {formStatus === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Sukces</AlertTitle>
            <AlertDescription>Formularz zastępczy został pomyślnie wygenerowany i pobrany.</AlertDescription>
          </Alert>
        )}

        {formStatus === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>Wystąpił problem podczas generowania formularza zastępczego.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="client-select">Wybierz klienta</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger id="client-select">
              <SelectValue placeholder="Wybierz klienta" />
            </SelectTrigger>
            <SelectContent>
              {allClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.Name || "Brak nazwy"} {client.NumerSprawy ? `(${client.NumerSprawy})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dostępne formularze</Label>
          <div className="rounded-md border p-4">
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-medium">Wniosek o udzielenie cudzoziemcowi zezwolenia na pobyt czasowy</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Oficjalny formularz wniosku o udzielenie zezwolenia na pobyt czasowy dla cudzoziemca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleGenerateForm} disabled={!selectedClientId || isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generowanie formularza...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Wygeneruj i pobierz formularz zastępczy
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

