"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Client, getClientById, updateClient } from "@/lib/superbase"
import { diffClientPatch } from "@/lib/client-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MainLayout from "@/components/main-layout"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { DetailsHeader } from "@/components/clients/details-header"
import { TimelinePanel } from "@/components/clients/timeline-panel"
import { NotesPanel } from "@/components/clients/notes-panel"
import { ContactPanel } from "@/components/clients/contact-panel"
import { CaseDataPanel } from "@/components/clients/case-data-panel"
import { DocsChecklistPanel } from "@/components/clients/docs-checklist-panel"
import { FinancesPanel } from "@/components/clients/finances-panel"
import { Card, CardContent } from "@/components/ui/card"

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleSave = async (patch: Partial<Client>): Promise<void> => {
    if (!client) return
    const changed = diffClientPatch(client, patch)
    if (Object.keys(changed).length === 0) return
    try {
      const updated = await updateClient(client.id, changed)
      setClient(updated)
      toast({ title: "Zapisano", description: "Dane klienta zostały zaktualizowane." })
    } catch (error) {
      console.error("Błąd zapisu klienta:", error)
      toast({
        title: "Błąd zapisu",
        description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
        variant: "destructive",
      })
      throw error // pozwala panelowi pozostać w trybie edycji
    }
  }

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        const foundClient = await getClientById(clientId)
        if (!foundClient) {
          setClient(null)
          return
        }
        setClient(foundClient)
      } catch (error) {
        console.error("Błąd podczas pobierania klienta:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać danych klienta.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClient()
  }, [clientId])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand mr-2" />
          <span className="text-text-dim">Ładowanie danych klienta...</span>
        </div>
      </MainLayout>
    )
  }
  
  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-text">Nie znaleziono klienta</h2>
          <p className="text-text-dim mt-2">Klient o podanym identyfikatorze nie istnieje lub został usunięty.</p>
          <button 
            onClick={() => router.push("/clients")}
            className="mt-6 text-brand font-medium hover:underline"
          >
            Wróć do listy klientów
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-8 pb-10">
        {/* New Details Header */}
        <DetailsHeader client={client} onSave={handleSave} />
        
        {/* Tab System with Underline Style */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-8">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0 text-[15px] font-semibold text-text-dim data-[state=active]:text-brand transition-all"
            >
              Przegląd
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0 text-[15px] font-semibold text-text-dim data-[state=active]:text-brand transition-all"
            >
              Dokumenty
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0 text-[15px] font-semibold text-text-dim data-[state=active]:text-brand transition-all"
            >
              Historia
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0 text-[15px] font-semibold text-text-dim data-[state=active]:text-brand transition-all"
            >
              Notatki
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0 text-[15px] font-semibold text-text-dim data-[state=active]:text-brand transition-all"
            >
              Finanse
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-8 border-none p-0 outline-none">
            {/* 1fr : 320px Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              {/* Left Column - Timeline & Notes */}
              <div className="flex flex-col gap-12">
                <TimelinePanel client={client} />
                <div className="h-px bg-border/60" />
                <NotesPanel client={client} onSave={handleSave} />
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                <ContactPanel client={client} onSave={handleSave} />
                <CaseDataPanel client={client} onSave={handleSave} />
                <DocsChecklistPanel client={client} onSave={handleSave} />
                <FinancesPanel client={client} onSave={handleSave} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-8 border-none p-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              <div className="flex flex-col gap-6">
                <DocsChecklistPanel client={client} onSave={handleSave} />
                <Card>
                  <CardContent className="py-10 text-center text-text-mute">
                    <p className="text-sm">Lista plików w chmurze (Supabase Storage)</p>
                    <div className="mt-4 flex flex-col gap-2 max-w-md mx-auto">
                      {client.Doc?.split(',').filter(Boolean).map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded border border-border bg-surface text-xs">
                          <span className="truncate flex-1 text-left px-2">{doc.split('/').pop()}</span>
                          <a href={doc} target="_blank" rel="noopener noreferrer" className="text-brand font-bold px-2 hover:underline">Otwórz</a>
                        </div>
                      )) || "Brak wgranych plików."}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col gap-6">
                <ContactPanel client={client} onSave={handleSave} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-8 border-none p-0 outline-none">
             <TimelinePanel client={client} />
          </TabsContent>
          
          <TabsContent value="notes" className="mt-8 border-none p-0 outline-none">
             <NotesPanel client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="finance" className="mt-8 border-none p-0 outline-none">
             <div className="max-w-2xl">
                <FinancesPanel client={client} onSave={handleSave} />
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
