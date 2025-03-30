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
import { RoleGuard } from "@/components/role-guard"

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topCountries, setTopCountries] = useState<{ country: string; count: number }[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [forceUpdate, setForceUpdate] = useState(0)
  const [upcomingExpirations, setUpcomingExpirations] = useState<Client[]>([])

  // Pobieranie klientÃ³w z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        console.log("Pobrani klienci:", data.length, "rekordÃ³w")
        setClients(data)
        
        // Obliczanie liczby klientÃ³w z poszczegÃ³lnych krajÃ³w
        const countriesMap = new Map<string, number>()
        
        data.forEach(client => {
          if (client.KrajPoch) {
            const country = client.KrajPoch
            countriesMap.set(country, (countriesMap.get(country) || 0) + 1)
          }
        })
        
        console.log("Mapa krajÃ³w:", Object.fromEntries(countriesMap))
        
        // Sortowanie krajÃ³w wedÂ³ug liczby klientÃ³w i wybieranie 6 najpopularniejszych
        const sortedCountries = Array.from(countriesMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([country, count]) => ({ country, count }))
        
        console.log("Posortowane kraje (top 6):", sortedCountries)
        setTopCountries(sortedCountries)
        
        // Pobieranie ostatnio dodanych klientÃ³w (sortowanie po CreatedDate)
        const sortedClients = [...data].sort((a, b) => {
          const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0
          const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0
          return dateB - dateA // Sortowanie od najnowszych do najstarszych
        }).slice(0, 5) // Pobierz 5 najnowszych klientÃ³w
        
        console.log("Ostatnio dodani klienci:", sortedClients)
        setRecentClients(sortedClients)

        // Pobieranie klientÃ³w z najbliÂ¿szymi datami zakoÃ±czenia legalnego pobytu
        const currentYear = new Date().getFullYear()
        const clientsWithExpiration = data
          .filter(client => {
            if (!client.DataZakLegPob) return false
            const expirationDate = new Date(client.DataZakLegPob)
            return expirationDate.getFullYear() === currentYear
          })
          .sort((a, b) => {
            const dateA = new Date(a.DataZakLegPob!).getTime()
            const dateB = new Date(b.DataZakLegPob!).getTime()
            return dateA - dateB // Sortowanie od najwczeÂniejszej daty
          })
          .slice(0, 5) // Pobierz 5 najbliÂ¿szych dat

        console.log("Klienci z najbliÂ¿szymi datami zakoÃ±czenia w roku:", currentYear, clientsWithExpiration)
        setUpcomingExpirations(clientsWithExpiration)

        // Wymuszenie przerenderowania po zaÂ³adowaniu danych
        setTimeout(() => {
          setForceUpdate(prev => prev + 1)
          window.dispatchEvent(new Event('resize'))
        }, 100)
      } catch (error) {
        console.error("BÂ³Â¹d podczas pobierania klientÃ³w:", error)
        toast({
          title: "BÂ³Â¹d",
          description: "Nie udaÂ³o siÃª pobraÃ¦ danych klientÃ³w. SprÃ³buj ponownie pÃ³Âniej.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Monitorowanie stanu topCountries
  useEffect(() => {
    console.log("Stan topCountries zostaÂ³ zaktualizowany:", topCountries)
  }, [topCountries])
  
  // Liczba aktywnych klientÃ³w (status !== "zakoÃ±czony")
  const activeClientsCount = clients.filter(client => 
    client.Status?.toLowerCase() !== "zakoÃ±czony" && 
    client.Status?.toLowerCase() !== "nieaktywny"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">PrzeglÂ¹d statystyk i metryk biznesowych</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">PrzeglÂ¹d</TabsTrigger>
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
                <div className="text-2xl font-bold">{isLoading ? "Â£adowanie..." : clients.length}</div>
                <p className="text-xs text-muted-foreground">Â£Â¹czna liczba klientÃ³w w systemie</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktywni klienci</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "Â£adowanie..." : activeClientsCount}</div>
                <p className="text-xs text-muted-foreground">Klienci o statusie aktywnym</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OczekujÂ¹ce faktury</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">-3 od ostatniego miesiÂ¹ca</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktywne projekty</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+4 od ostatniego miesiÂ¹ca</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RoleGuard allowedRoles={["boss", "admin"]}>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Kraje pochodzenia klientÃ³w</CardTitle>
                  <CardDescription>Top 6 krajÃ³w wedÂ³ug liczby klientÃ³w</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <p>Â£adowanie danych...</p>
                    </div>
                  ) : topCountries.length > 0 ? (
                    <div className="h-full w-full" key={forceUpdate}>
                      <Chart 
                        data={topCountries.map((item) => ({
                          name: item.country,
                          value: item.count,
                        }))}
                        type="bar"
                      >
                        <ChartContainer>
                          <ChartTooltip>
                            <ChartTooltipContent />
                          </ChartTooltip>
                          <ChartGrid />
                          <ChartXAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <ChartYAxis />
                          <ChartBar 
                            dataKey="value" 
                            fill="hsl(var(--primary))" 
                            name="Liczba klientÃ³w"
                            radius={[4, 4, 0, 0]}
                          />
                          <ChartLegend>
                            <ChartLegendItem name="Liczba klientÃ³w" color="hsl(var(--primary))" />
                          </ChartLegend>
                        </ChartContainer>
                      </Chart>
                    </div>
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
                <CardTitle>Wzrost liczby klientÃ³w</CardTitle>
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
            <Card className="col-span-2 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Ostatnie aktywnoÂci</CardTitle>
                <CardDescription>Najnowsze dziaÂ³ania w systemie</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <p>Â£adowanie danych...</p>
                  </div>
                ) : recentClients.length > 0 ? (
                  <div className="space-y-4">
                    {recentClients.map((client) => {
                      // Obliczenie, ile czasu minÃªÂ³o od dodania klienta
                      const createdDate = client.CreatedDate 
                        ? new Date(client.CreatedDate) 
                        : null;
                      
                      let timeAgo = "niedawno";
                      if (createdDate) {
                        const now = new Date();
                        const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                        
                        if (diffInHours < 24) {
                          timeAgo = diffInHours === 1 ? "1h temu" : `DziÂ`;
                        } else {
                          const diffInDays = Math.floor(diffInHours / 24);
                          timeAgo = diffInDays === 1 ? "1 dzieÃ± temu" : `${diffInDays} dni temu`;
                        }
                      }
                      
                      return (
                        <div key={client.id} className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Nowy klient dodany</p>
                            <p className="text-sm text-muted-foreground">{client.Name} zostaÂ³ pomyÂlnie dodany</p>
                          </div>
                          <div className="text-xs text-muted-foreground">{timeAgo}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p>Brak ostatnich aktywnoÂci</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>NadchodzÂ¹ce ZakoÃ±czenie Legalnego Pobytu</CardTitle>
                <CardDescription>Klienci z koÃ±czÂ¹cym siÃª legalnym pobytem w {new Date().getFullYear()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="py-8 flex items-center justify-center">
                      <p>Â£adowanie danych...</p>
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
                        timeLabel = "DziÂ"
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
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                diffDays < 0 
                                  ? "bg-destructive/10 text-destructive" 
                                  : diffDays <= 7 
                                    ? "bg-warning/10 text-warning" 
                                    : "bg-primary/10 text-primary"
                              }`}>
                                {timeLabel}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Data zakoÃ±czenia: {expirationDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <p>Brak nadchodzÂ¹cych zadaÃ± w tym roku</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zaawansowana analityka</CardTitle>
              <CardDescription>SzczegÃ³Â³owa analiza wydajnoÂci biznesu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <BarChart size={48} />
                  <p>Zaawansowana analityka pojawi siÃª tutaj</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raporty biznesowe</CardTitle>
              <CardDescription>Generuj i przeglÂ¹daj raporty biznesowe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <LineChart size={48} />
                  <p>Raporty pojawiÂ¹ siÃª tutaj</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

