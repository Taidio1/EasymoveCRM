"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CreditCard, DollarSign, Activity, BarChart, LineChart, Globe } from "lucide-react"
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
import { getClients, type Client } from "@/lib/superbase"
import { toast } from "@/hooks/use-toast"

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topCountries, setTopCountries] = useState<{ country: string; count: number }[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [forceUpdate, setForceUpdate] = useState(0)

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
          if (client.KrajPoch) {
            const country = client.KrajPoch
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

  // Wymuszenie aktualizacji wykresu po załadowaniu danych
  useEffect(() => {
    if (!isLoading && topCountries.length > 0) {
      // Hack, który wymusza ponowne renderowanie wykresów
      const timer = setTimeout(() => {
        setForceUpdate(prev => prev + 1);
        window.dispatchEvent(new Event('resize'));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, topCountries]);

  // Monitorowanie stanu topCountries
  useEffect(() => {
    console.log("Stan topCountries został zaktualizowany:", topCountries)
  }, [topCountries])
  
  // Liczba aktywnych klientów (status !== "zakończony")
  const activeClientsCount = clients.filter(client => 
    client.Status?.toLowerCase() !== "zakończony" && 
    client.Status?.toLowerCase() !== "nieaktywny"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Przegląd statystyk i metryk biznesowych</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="analytics">Analityka</TabsTrigger>
          <TabsTrigger value="reports">Raporty</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Metric Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wszyscy klienci</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "Ładowanie..." : clients.length}</div>
                <p className="text-xs text-muted-foreground">Łączna liczba klientów w systemie</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktywni klienci</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "Ładowanie..." : activeClientsCount}</div>
                <p className="text-xs text-muted-foreground">Klienci o statusie aktywnym</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oczekujące faktury</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">-3 od ostatniego miesiąca</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktywne projekty</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+4 od ostatniego miesiąca</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                  <div className="h-full w-full">
                    <Chart data={topCountries} type="bar">
                      <ChartContainer>
                        <ChartTooltip>
                          <ChartTooltipContent />
                        </ChartTooltip>
                        <ChartGrid />
                        <ChartXAxis dataKey="country" />
                        <ChartYAxis />
                        <ChartBar 
                          dataKey="count" 
                          fill="hsl(var(--primary))" 
                          name="Liczba klientów"
                        />
                      </ChartContainer>
                    </Chart>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <Globe className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Brak danych o krajach pochodzenia</p>
                    <button 
                      onClick={() => console.log("Debugowanie danych:", { topCountries, isLoading })}
                      className="text-xs text-primary underline mt-2"
                    >
                      Debuguj dane
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Wzrost liczby klientów</CardTitle>
                <CardDescription>Aktywni vs nowi klienci</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full">
                  <Chart type="bar">
                    <ChartContainer>
                      <ChartTooltip>
                        <ChartTooltipContent />
                      </ChartTooltip>
                      <ChartGrid />
                      <ChartXAxis dataKey="month" />
                      <ChartYAxis />
                      <ChartBar dataKey="active" fill="hsl(var(--primary))" name="Aktywni klienci" />
                      <ChartBar dataKey="new" fill="hsl(var(--primary) / 0.5)" name="Nowi klienci" />
                      <ChartLegend>
                        <ChartLegendItem name="Aktywni klienci" color="hsl(var(--primary))" />
                        <ChartLegendItem name="Nowi klienci" color="hsl(var(--primary) / 0.5)" />
                      </ChartLegend>
                    </ChartContainer>
                  </Chart>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
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
                <CardTitle>Nadchodzące zadania</CardTitle>
                <CardDescription>Zadania wymagające twojej uwagi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">Spotkanie z klientem #{i}</p>
                          <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {i === 1 ? "Dziś" : `Za ${i} dni`}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Omówienie wymagań projektu z Klientem #{i}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zaawansowana analityka</CardTitle>
              <CardDescription>Szczegółowa analiza wydajności biznesu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <BarChart size={48} />
                  <p>Zaawansowana analityka pojawi się tutaj</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raporty biznesowe</CardTitle>
              <CardDescription>Generuj i przeglądaj raporty biznesowe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <LineChart size={48} />
                  <p>Raporty pojawią się tutaj</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

