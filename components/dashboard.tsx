"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CreditCard, DollarSign, Activity, BarChart, LineChart } from "lucide-react"
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

// Sample data for charts
const revenueData = [
  { month: "Jan", revenue: 2400 },
  { month: "Feb", revenue: 1398 },
  { month: "Mar", revenue: 9800 },
  { month: "Apr", revenue: 3908 },
  { month: "May", revenue: 4800 },
  { month: "Jun", revenue: 3800 },
  { month: "Jul", revenue: 4300 },
]

const clientData = [
  { month: "Jan", active: 40, new: 24 },
  { month: "Feb", active: 30, new: 13 },
  { month: "Mar", active: 45, new: 20 },
  { month: "Apr", active: 50, new: 22 },
  { month: "May", active: 65, new: 28 },
  { month: "Jun", active: 75, new: 32 },
  { month: "Jul", active: 85, new: 45 },
]

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Pobieranie klientów z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)
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
                <CardTitle>Przegląd przychodów</CardTitle>
                <CardDescription>Miesięczne przychody w bieżącym roku</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Chart>
                  <ChartContainer>
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                    <ChartGrid />
                    <ChartXAxis dataKey="month" />
                    <ChartYAxis />
                    <ChartArea
                      dataKey="revenue"
                      fill="hsl(var(--primary) / 0.2)"
                      stroke="hsl(var(--primary))"
                      data={revenueData as any}
                    />
                    <ChartLine dataKey="revenue" stroke="hsl(var(--primary))" data={revenueData as any} />
                  </ChartContainer>
                </Chart>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Wzrost liczby klientów</CardTitle>
                <CardDescription>Aktywni vs nowi klienci</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Chart>
                  <ChartContainer>
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                    <ChartGrid />
                    <ChartXAxis dataKey="month" />
                    <ChartYAxis />
                    <ChartBar dataKey="active" fill="hsl(var(--primary))" data={clientData as any} />
                    <ChartBar dataKey="new" fill="hsl(var(--primary) / 0.5)" data={clientData as any} />
                    <ChartLegend>
                      <ChartLegendItem name="Aktywni klienci" color="hsl(var(--primary))" />
                      <ChartLegendItem name="Nowi klienci" color="hsl(var(--primary) / 0.5)" />
                    </ChartLegend>
                  </ChartContainer>
                </Chart>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ostatnie aktywności</CardTitle>
                <CardDescription>Najnowsze działania w twoim koncie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Nowy klient dodany</p>
                        <p className="text-sm text-muted-foreground">Klient #{i} został pomyślnie dodany</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{i}h temu</div>
                    </div>
                  ))}
                </div>
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

