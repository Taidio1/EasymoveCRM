"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Clock, 
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink
} from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"

interface AnalyticsData {
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  totalConversions: number;
  averageSessionDuration: number;
  bounceRate: number;
  growthRate: number;
  topTrafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    deviceCategory: string;
    sessions: number;
    users: number;
    percentage: number;
  }>;
  dailyMetrics: Array<{
    date: string;
    sessions: number;
    users: number;
    newUsers: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversions: number;
  }>;
}

const DEVICE_COLORS = {
  mobile: '#4f46e5',
  desktop: '#059669', 
  tablet: '#dc2626'
};

const DEVICE_ICONS = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet
};

export function WebsiteAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/analytics');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setLastUpdated(result.lastUpdated);
        }
      } catch (error) {
        console.error('Błąd pobierania analityki:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Analityka strony www.easy-move.pl</h3>
          <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Nie udało się załadować danych analitycznych.</p>
        </CardContent>
      </Card>
    );
  }

  // Formatowanie czasu trwania sesji
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Przygotowanie danych dla wykresu trend
  const chartData = data.dailyMetrics.map(day => ({
    date: new Date(day.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
    sessions: day.sessions,
    users: day.users
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analityka strony www.easy-move.pl</h3>
          <p className="text-sm text-muted-foreground">
            Ostatnia aktualizacja: {new Date(lastUpdated).toLocaleString('pl-PL')}
          </p>
        </div>
        <a 
          href="https://analytics.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Otwórz GA4 <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Główne metryki */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesje (30 dni)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.growthRate > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(data.growthRate)}% vs poprzedni okres
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Użytkownicy</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.totalUsers / data.totalSessions) * 100)}% unikalnych sesji
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wyświetlenia stron</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(data.totalPageViews / data.totalSessions * 10) / 10} stron/sesja
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konwersje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.totalConversions / data.totalSessions) * 1000) / 10}% współczynnik konwersji
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy i szczegóły */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Trend sesji */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Trend sesji (30 dni)</CardTitle>
            <CardDescription>Dzienna liczba sesji i użytkowników</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    dot={{ fill: "#4f46e5", strokeWidth: 2, r: 3 }}
                    name="Sesje"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#059669" 
                    strokeWidth={2}
                    dot={{ fill: "#059669", strokeWidth: 2, r: 3 }}
                    name="Użytkownicy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Urządzenia */}
        <Card>
          <CardHeader>
            <CardTitle>Urządzenia</CardTitle>
            <CardDescription>Podział ruchu według urządzeń</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceBreakdown.map((device) => {
                const Icon = DEVICE_ICONS[device.deviceCategory as keyof typeof DEVICE_ICONS];
                return (
                  <div key={device.deviceCategory} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize text-sm">{device.deviceCategory}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{device.percentage}%</span>
                      <div className="w-20">
                        <Progress 
                          value={device.percentage} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Źródła ruchu */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 źródeł ruchu</CardTitle>
          <CardDescription>Najważniejsze kanały pozyskiwania użytkowników</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topTrafficSources.map((source, index) => (
              <div key={`${source.source}-${source.medium}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 text-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{source.source}</p>
                    <p className="text-xs text-muted-foreground">{source.medium}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{source.sessions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{source.percentage}% ruchu</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowe metryki */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Średni czas na stronie</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.averageSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              {data.averageSessionDuration > 180 ? 'Dobra wartość' : 'Możliwość poprawy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Współczynnik odrzuceń</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.bounceRate < 50 ? 'Bardzo dobra wartość' : 'Możliwość poprawy'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 