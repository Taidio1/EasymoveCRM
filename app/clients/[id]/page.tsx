"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Client, getClientById } from "@/lib/superbase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MainLayout from "@/components/main-layout"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { DetailsHeader } from "@/components/clients/details-header"

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
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
        <DetailsHeader client={client} />
        
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
              {/* Left Column Placeholder */}
              <div className="flex flex-col gap-6">
                <div className="min-h-[500px] border-2 border-dashed border-border-strong rounded-panel flex flex-col items-center justify-center text-text-mute bg-surface/50 p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border-strong flex items-center justify-center mb-4">
                    <Loader2 className="h-5 w-5 animate-spin opacity-20" />
                  </div>
                  <p className="text-sm font-medium text-text">Obszar główny (Przegląd)</p>
                  <p className="text-xs max-w-[240px] mt-1">Tutaj znajdą się karty z danymi klienta, postępem sprawy oraz ostatnią aktywnością.</p>
                </div>
              </div>
              
              {/* Right Column Placeholder */}
              <div className="flex flex-col gap-6">
                <div className="min-h-[500px] border-2 border-dashed border-border-strong rounded-panel flex flex-col items-center justify-center text-text-mute bg-surface/50 p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border-strong flex items-center justify-center mb-4">
                    <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                  </div>
                  <p className="text-sm font-medium text-text">Panel boczny</p>
                  <p className="text-xs max-w-[200px] mt-1">Miejsce na szybkie statystyki, przypisane osoby, tagi i kluczowe daty.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-8 border-none p-0 outline-none">
            <div className="min-h-[400px] border-2 border-dashed border-border-strong rounded-panel flex items-center justify-center text-text-mute bg-surface/50">
              Dokumenty Placeholder
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-8 border-none p-0 outline-none">
            <div className="min-h-[400px] border-2 border-dashed border-border-strong rounded-panel flex items-center justify-center text-text-mute bg-surface/50">
              Historia Placeholder
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-8 border-none p-0 outline-none">
            <div className="min-h-[400px] border-2 border-dashed border-border-strong rounded-panel flex items-center justify-center text-text-mute bg-surface/50">
              Notatki Placeholder
            </div>
          </TabsContent>
          
          <TabsContent value="finance" className="mt-8 border-none p-0 outline-none">
            <div className="min-h-[400px] border-2 border-dashed border-border-strong rounded-panel flex items-center justify-center text-text-mute bg-surface/50">
              Finanse Placeholder
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
