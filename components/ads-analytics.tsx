"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  Wallet,
  Target,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { AdsData } from "@/lib/ads-service"

const DEVICE_ICONS: Record<string, React.ElementType> = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string
  value: string
  sub: string
  icon: React.ElementType
  trend?: "up" | "down"
  trendValue?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
          {trendValue ? <span className={trend === "up" ? "text-green-600" : "text-red-600"}>{trendValue}</span> : null}
          {trendValue && sub ? <span className="ml-1">{sub}</span> : <span>{sub}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdsAnalytics() {
  const [data, setData] = useState<AdsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")
  const [dataSource, setDataSource] = useState<"google_ads" | "mock">("mock")

  useEffect(() => {
    async function fetchAds() {
      setIsLoading(true)
      try {
        const res = await fetch("/api/ads")
        const result = await res.json()
        if (result.success) {
          setData(result.data)
          setLastUpdated(result.lastUpdated)
          setDataSource(result.source ?? "mock")
        }
      } catch (err) {
        console.error("Błąd pobierania danych Google Ads:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAds()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Nie udało się załadować danych Google Ads.</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.dailyMetrics.map((d) => ({
    date: new Date(d.date).toLocaleDateString("pl-PL", { month: "short", day: "numeric" }),
    Kliknięcia: d.clicks,
    Konwersje: d.conversions,
    "Koszt (zł)": d.costPln,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Google Ads — www.easy-move.pl</h3>
            {dataSource === "mock" && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                DEMO
              </Badge>
            )}
            {dataSource === "google_ads" && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                Live
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ostatnia aktualizacja: {new Date(lastUpdated).toLocaleString("pl-PL")}
          </p>
        </div>
        <a
          href="https://ads.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Otwórz Google Ads <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Karty głównych metryk */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Kliknięcia (30 dni)"
          value={data.totalClicks.toLocaleString("pl-PL")}
          sub="vs poprzedni okres"
          icon={MousePointer}
          trend={data.clickGrowthRate >= 0 ? "up" : "down"}
          trendValue={`${data.clickGrowthRate >= 0 ? "+" : ""}${data.clickGrowthRate}%`}
        />
        <MetricCard
          title="Wyświetlenia"
          value={data.totalImpressions.toLocaleString("pl-PL")}
          sub={`CTR: ${data.ctr}%`}
          icon={Eye}
        />
        <MetricCard
          title="Wydatki (30 dni)"
          value={`${data.totalCostPln.toLocaleString("pl-PL")} zł`}
          sub={`Śr. CPC: ${data.averageCpc} zł`}
          icon={Wallet}
        />
        <MetricCard
          title="Konwersje"
          value={data.totalConversions.toLocaleString("pl-PL")}
          sub={`Koszt/konw.: ${data.costPerConversion} zł`}
          icon={Target}
          trend="up"
          trendValue={`${data.conversionRate}%`}
        />
      </div>

      {/* Wykres trendu */}
      <Card>
        <CardHeader>
          <CardTitle>Trend (30 dni)</CardTitle>
          <CardDescription>Dzienne kliknięcia i konwersje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Kliknięcia"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Konwersje"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top kampanie */}
        <Card>
          <CardHeader>
            <CardTitle>Top kampanie</CardTitle>
            <CardDescription>Według liczby kliknięć (30 dni)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCampaigns.map((campaign, index) => (
                <div key={campaign.name} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <Badge variant="outline" className="w-6 text-center shrink-0 mt-0.5">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        CTR: {campaign.ctr}% · {campaign.costPln} zł
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-sm">{campaign.clicks.toLocaleString("pl-PL")}</p>
                    <p className="text-xs text-muted-foreground">{campaign.conversions} konw.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Urządzenia */}
        <Card>
          <CardHeader>
            <CardTitle>Urządzenia</CardTitle>
            <CardDescription>Podział kliknięć według urządzeń</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceBreakdown.map((device) => {
                const Icon = DEVICE_ICONS[device.device] ?? Monitor
                return (
                  <div key={device.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize text-sm">{device.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{device.percentage}%</span>
                      <div className="w-20">
                        <Progress value={device.percentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Dodatkowe metryki */}
            <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Wsp. konwersji</p>
                <p className="text-lg font-semibold">{data.conversionRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Koszt / konwersja</p>
                <p className="text-lg font-semibold">{data.costPerConversion} zł</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Śr. CPC</p>
                <p className="text-lg font-semibold">{data.averageCpc} zł</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-lg font-semibold">{data.ctr}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
