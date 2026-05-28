"use client"

import { useEffect, useState } from "react"
import { getClients, type Client } from "@/lib/superbase"
import { toast } from "@/hooks/use-toast"
import { ClientDetailsModal } from "./client-details-modal"
import { GreetingRow } from "./dashboard/greeting-row"
import { StatCard } from "./dashboard/stat-card"
import { AttentionPanel } from "./dashboard/attention-panel"
import { PipelinePanel } from "./dashboard/pipeline-panel"
import { TodayAppointments } from "./dashboard/today-appointments"
import { MiniGrowthChart } from "./dashboard/mini-growth-chart"
import { ActivityFeed } from "./dashboard/activity-feed"

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [upcomingExpirations, setUpcomingExpirations] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Pobieranie klientów z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)

        const sortedClients = [...data].sort((a, b) => {
          const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0
          const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0
          return dateB - dateA
        }).slice(0, 5)
        setRecentClients(sortedClients)

        // Pobieranie klientów z DataZakLegPob w ciągu najbliższych 6 miesięcy
        const today = new Date()
        const sixMonthsFromNow = new Date()
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
        
        const clientsWithExpiration = data
          .filter(client => {
            if (!client.DataZakLegPob) return false
            const expirationDate = new Date(client.DataZakLegPob)
            // Filtruj klientów których data zakończenia jest w ciągu najbliższych 6 miesięcy
            return expirationDate >= today && expirationDate <= sixMonthsFromNow
          })
          .sort((a, b) => {
            const dateA = new Date(a.DataZakLegPob!).getTime()
            const dateB = new Date(b.DataZakLegPob!).getTime()
            return dateA - dateB // Sortowanie od najwcześniejszej daty
          })
          .slice(0, 5) // Pobierz 5 najbliższych dat

        setUpcomingExpirations(clientsWithExpiration)
      } catch (error) {
        console.error("Błąd podczas pobierania klientów:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać danych klientów. Spróbuj ponownie później.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Liczba aktywnych klientów (status !== "zakończony")
  const activeClientsCount = clients.filter(client =>
    client.Status?.toLowerCase() !== "zakończony" &&
    client.Status?.toLowerCase() !== "nieaktywny"
  ).length

  // Sprawy wymagające uwagi (urgent)
  const urgentCount = clients.filter(client => 
    client.Status?.toLowerCase() === "weryfikacja" || 
    client.Status?.toLowerCase() === "braki"
  ).length

  // Funkcja do otwierania szczegółów klienta
  const handleOpenClientDetails = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsModalOpen(true)
  }

  // Funkcja do aktualizacji klienta w liście
  const handleClientUpdated = (updatedClient: Client) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    )
    // Aktualizuj też upcomingExpirations jeśli klient tam jest
    setUpcomingExpirations(prevExpirations =>
      prevExpirations.map(client =>
        client.id === updatedClient.id ? updatedClient : client
      )
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── ROW 1: Greeting – full width ───────────────────────────────── */}
      <GreetingRow
        name="Użytkowniku"
        stats={{ appointments: upcomingExpirations.length || 4, urgent: urgentCount }}
      />

      {/* ── ROW 2: Stat Cards – 4 columns ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Aktywni klienci"
          value={isLoading ? "..." : activeClientsCount}
          delta="+12"
          trend="up"
          colorClass="bg-brand"
          subtitle="w tym miesiącu"
        />
        <StatCard
          label="Sprawy w toku"
          value={isLoading ? "..." : clients.filter(c => c.Status?.toLowerCase() === "w trakcie" || c.Status?.toLowerCase() === "weryfikacja").length}
          delta="-44"
          trend="down"
          colorClass="bg-warn"
          subtitle="82 zakończone"
        />
        <StatCard
          label="Terminy (7 dni)"
          value={upcomingExpirations.length || 23}
          colorClass="bg-pobyt"
          subtitle="4 dziś, 6 jutro"
        />

      </div>

      {/* ── ROW 3: Main 2-column section ───────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6 items-start">

        {/* LEFT COLUMN: Attention + Pipeline */}
        <div className="flex flex-col gap-6">
          <AttentionPanel clients={clients} isLoading={isLoading} />
          <PipelinePanel clients={clients} isLoading={isLoading} />
        </div>

        {/* RIGHT COLUMN: Today Appointments + Mini Chart + Activity Feed */}
        <div className="flex flex-col gap-6">
          <TodayAppointments clients={clients} />
          <MiniGrowthChart clients={clients} />
          <ActivityFeed clients={recentClients} />
        </div>
      </div>

      {/* Modal szczegółów klienta */}
      <ClientDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  )
}