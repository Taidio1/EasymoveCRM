"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Activity, Globe, ExternalLink } from "lucide-react"
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendItem,
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
  ChartArea,
  ChartLine,
  ChartBar,
} from "@/components/ui/chart"
import { getClients, getQuarterlyClientData, type Client, type QuarterlyData } from "@/lib/superbase"
import { toast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/role-guard"
import { CountriesChart } from "./countries-chart"
import { QuarterlyGrowthChart } from "./quarterly-growth-chart"
import { ClientDetailsModal } from "./client-details-modal"
import { WebsiteAnalytics } from "./website-analytics"
import { GreetingRow } from "./dashboard/greeting-row"
import { StatCard } from "./dashboard/stat-card"

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topCountries, setTopCountries] = useState<{ country: string; count: number }[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [forceUpdate, setForceUpdate] = useState(0)
  const [upcomingExpirations, setUpcomingExpirations] = useState<Client[]>([])
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([])
  const [quarterlyLoading, setQuarterlyLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Pobieranie klientów z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        console.log("Pobrani klienci:", data.length, "rekordów")
        setClients(data)

        // Obliczanie liczby klientów z poszczególnych krajów
        const countriesMap = new Map<string, number>()

        data.forEach(client => {
          if (client.country_name) {
            const country = client.country_name
            countriesMap.set(country, (countriesMap.get(country) || 0) + 1)
          }
        })

        console.log("Mapa krajów:", Object.fromEntries(countriesMap))

        // Sortowanie krajów według liczby klientów i wybieranie 6 najpopularniejszych
        const sortedCountries = Array.from(countriesMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([country, count]) => ({ country, count }))

        console.log("Posortowane kraje (top 6):", sortedCountries)
        setTopCountries(sortedCountries)

        // Pobieranie ostatnio dodanych klientów (sortowanie po CreatedDate)
        const sortedClients = [...data].sort((a, b) => {
          const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0
          const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0
          return dateB - dateA // Sortowanie od najnowszych do najstarszych
        }).slice(0, 5) // Pobierz 5 najnowszych klientów

        console.log("Ostatnio dodani klienci:", sortedClients)
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

        console.log("Klienci z datami zakończenia w ciągu 6 miesięcy:", clientsWithExpiration)
        setUpcomingExpirations(clientsWithExpiration)

        // Wymuszenie przerenderowania po załadowaniu danych
        setTimeout(() => {
          setForceUpdate(prev => prev + 1)
          window.dispatchEvent(new Event('resize'))
        }, 100)
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

  // Pobieranie danych kwartalnych
  useEffect(() => {
    async function fetchQuarterlyData() {
      setQuarterlyLoading(true)
      try {
        const data = await getQuarterlyClientData()
        console.log("Dane kwartalne:", data)
        setQuarterlyData(data)
      } catch (error) {
        console.error("Błąd podczas pobierania danych kwartalnych:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać danych kwartalnych. Spróbuj ponownie później.",
          variant: "destructive",
        })
      } finally {
        setQuarterlyLoading(false)
      }
    }

    fetchQuarterlyData()
  }, [])

  // Monitorowanie stanu topCountries
  useEffect(() => {
    console.log("Stan topCountries został zaktualizowany:", topCountries)
  }, [topCountries])

  // Liczba aktywnych klientów (status !== "zakończony")
  const activeClientsCount = clients.filter(client =>
    client.Status?.toLowerCase() !== "zakończony" &&
    client.Status?.toLowerCase() !== "nieaktywny"
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

  useEffect(() => {
    // Zwiększ opóźnienie renderowania wykresu
    if (!isLoading && topCountries.length > 0) {
      setTimeout(() => {
        setForceUpdate(prev => prev + 1)
        window.dispatchEvent(new Event('resize'))
      }, 500) // Zwiększ opóźnienie do 500ms
    }
  }, [isLoading, topCountries])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
      <div className="space-y-8">
        <GreetingRow name="Użytkowniku" stats={{ appointments: 4, urgent: 2 }} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="website-analytics">Analityka Strony</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                label="Wszyscy klienci" 
                value={isLoading ? "..." : clients.length} 
                colorClass="bg-brand"
              />
              <StatCard 
                label="Aktywni klienci" 
                value={isLoading ? "..." : activeClientsCount} 
                colorClass="bg-pobyt"
              />
              <StatCard 
                label="Oczekujące faktury" 
                value="12" 
                delta="3"
                trend="down"
                colorClass="bg-warn"
              />
              <StatCard 
                label="Aktywne projekty" 
                value="24" 
                delta="4"
                trend="up"
                colorClass="bg-success"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <RoleGuard allowedRoles={["boss", "admin"]}>
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Kraje pochodzenia klientów</CardTitle>
                    <CardDescription>Top 6 krajów według liczby klientów</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p>Ładowanie danych...</p>
                      </div>
                    ) : topCountries.length > 0 ? (
                      <CountriesChart data={topCountries} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-2">
                        <Globe className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Brak danych o krajach pochodzenia</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </RoleGuard>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Wzrost liczby klientów</CardTitle>
                  <CardDescription>Kwartalne dane nowych klientów (na podstawie dat złożenia wniosków)</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {quarterlyLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <p>Ładowanie danych kwartalnych...</p>
                    </div>
                  ) : quarterlyData.length > 0 ? (
                    <QuarterlyGrowthChart data={quarterlyData} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <Activity className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Brak danych kwartalnych</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2 md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Ostatnie aktywności</CardTitle>
                  <CardDescription>Najnowsze działania w systemie</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-8 flex items-center justify-center">
                      <p>Ładowanie danych...</p>
                    </div>
                  ) : recentClients.length > 0 ? (
                    <div className="space-y-4">
                      {recentClients.map((client) => {
                        // Obliczenie, ile czasu minęło od dodania klienta
                        const createdDate = client.CreatedDate
                          ? new Date(client.CreatedDate)
                          : null;

                        let timeAgo = "niedawno";
                        if (createdDate) {
                          const now = new Date();
                          const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

                          if (diffInHours < 24) {
                            timeAgo = diffInHours === 1 ? "1h temu" : `Dziś`;
                          } else {
                            const diffInDays = Math.floor(diffInHours / 24);
                            timeAgo = diffInDays === 1 ? "1 dzień temu" : `${diffInDays} dni temu`;
                          }
                        }

                        return (
                          <div key={client.id} className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">Nowy klient dodany</p>
                              <p className="text-sm text-muted-foreground">{client.Name} został pomyślnie dodany</p>
                            </div>
                            <div className="text-xs text-muted-foreground">{timeAgo}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <p>Brak ostatnich aktywności</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Nadchodzące Zakończenie Legalnego Pobytu</CardTitle>
                  <CardDescription>Klienci z kończącym się legalnym pobytem w ciągu najbliższych 6 miesięcy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <p>Ładowanie danych...</p>
                      </div>
                    ) : upcomingExpirations.length > 0 ? (
                      upcomingExpirations.map((client) => {
                        const expirationDate = new Date(client.DataZakLegPob!)
                        const today = new Date()
                        const diffTime = expirationDate.getTime() - today.getTime()
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                        let timeLabel = ""
                        if (diffDays < 0) {
                          timeLabel = "Przekroczono"
                        } else if (diffDays === 0) {
                          timeLabel = "Dziś"
                        } else if (diffDays === 1) {
                          timeLabel = "Jutro"
                        } else {
                          timeLabel = `Za ${diffDays} dni`
                        }

                        return (
                          <div key={client.id} className="flex items-start gap-4">
                            <div className="mt-1 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none">{client.Name}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs px-2 py-1 rounded-full ${
                                    diffDays < 0
                                      ? "bg-destructive/10 text-destructive"
                                      : diffDays <= 7
                                        ? "bg-warning/10 text-warning"
                                        : "bg-primary/10 text-primary"
                                  }`}>
                                    {timeLabel}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenClientDetails(client)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Szczegóły
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Data zakończenia: {expirationDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <p>Brak nadchodzących zakończeń w ciągu najbliższych 6 miesięcy</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="website-analytics" className="space-y-4">
            <WebsiteAnalytics />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column (Empty for now) */}
      <div className="space-y-8">
      </div>

      {/* Modal szczegółów klienta - stays outside the grid for logical structure, 
          though it doesn't affect layout as it's absolute/fixed */}
      <ClientDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  )
}