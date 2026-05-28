import { BetaAnalyticsDataClient } from '@google-analytics/data'

export interface AnalyticsData {
  totalSessions: number
  totalUsers: number
  totalPageViews: number
  totalConversions: number
  averageSessionDuration: number
  bounceRate: number
  growthRate: number
  topTrafficSources: Array<{
    source: string
    medium: string
    sessions: number
    users: number
    percentage: number
  }>
  deviceBreakdown: Array<{
    deviceCategory: string
    sessions: number
    users: number
    percentage: number
  }>
  dailyMetrics: Array<{
    date: string
    sessions: number
    users: number
    newUsers: number
    pageViews: number
    averageSessionDuration: number
    bounceRate: number
    conversions: number
  }>
}

function isConfigured(): boolean {
  return !!(
    process.env.GA4_PROPERTY_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  )
}

function createClient(): BetaAnalyticsDataClient {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  })
}

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  if (!isConfigured()) return null

  const client = createClient()
  const propertyId = process.env.GA4_PROPERTY_ID!

  try {
    const [summaryResponse, dailyResponse, sourcesResponse, devicesResponse, prevPeriodResponse] =
      await Promise.all([
        // Podsumowanie 30 dni
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
        // Dzienne metryki
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'conversions' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        }),
        // Źródła ruchu
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          limit: 5,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        }),
        // Urządzenia
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        }),
        // Poprzedni okres (do obliczenia growthRate)
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
          metrics: [{ name: 'sessions' }],
        }),
      ])

    // Podsumowanie
    const summaryRow = summaryResponse[0].rows?.[0]
    const totalSessions = parseInt(summaryRow?.metricValues?.[0]?.value ?? '0')
    const totalUsers = parseInt(summaryRow?.metricValues?.[1]?.value ?? '0')
    const totalPageViews = parseInt(summaryRow?.metricValues?.[2]?.value ?? '0')
    const totalConversions = parseInt(summaryRow?.metricValues?.[3]?.value ?? '0')
    const averageSessionDuration = Math.round(parseFloat(summaryRow?.metricValues?.[4]?.value ?? '0'))
    const bounceRate = Math.round(parseFloat(summaryRow?.metricValues?.[5]?.value ?? '0') * 100) / 100

    // Growth rate vs poprzedni okres
    const prevSessions = parseInt(prevPeriodResponse[0].rows?.[0]?.metricValues?.[0]?.value ?? '0')
    const growthRate =
      prevSessions > 0 ? Math.round(((totalSessions - prevSessions) / prevSessions) * 100) : 0

    // Dzienne metryki
    const dailyMetrics = (dailyResponse[0].rows ?? []).map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value ?? ''
      // Format: YYYYMMDD → YYYY-MM-DD
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      return {
        date,
        sessions: parseInt(row.metricValues?.[0]?.value ?? '0'),
        users: parseInt(row.metricValues?.[1]?.value ?? '0'),
        newUsers: parseInt(row.metricValues?.[2]?.value ?? '0'),
        pageViews: parseInt(row.metricValues?.[3]?.value ?? '0'),
        averageSessionDuration: Math.round(parseFloat(row.metricValues?.[4]?.value ?? '0')),
        bounceRate: Math.round(parseFloat(row.metricValues?.[5]?.value ?? '0') * 100) / 100,
        conversions: parseInt(row.metricValues?.[6]?.value ?? '0'),
      }
    })

    // Źródła ruchu z procentami
    const sourceRows = sourcesResponse[0].rows ?? []
    const totalSourceSessions = sourceRows.reduce(
      (sum, r) => sum + parseInt(r.metricValues?.[0]?.value ?? '0'),
      0
    )
    const topTrafficSources = sourceRows.map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value ?? '0')
      return {
        source: row.dimensionValues?.[0]?.value ?? '(unknown)',
        medium: row.dimensionValues?.[1]?.value ?? '(unknown)',
        sessions,
        users: parseInt(row.metricValues?.[1]?.value ?? '0'),
        percentage:
          totalSourceSessions > 0 ? Math.round((sessions / totalSourceSessions) * 100) : 0,
      }
    })

    // Urządzenia z procentami
    const deviceRows = devicesResponse[0].rows ?? []
    const totalDeviceSessions = deviceRows.reduce(
      (sum, r) => sum + parseInt(r.metricValues?.[0]?.value ?? '0'),
      0
    )
    const deviceBreakdown = deviceRows.map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value ?? '0')
      return {
        deviceCategory: row.dimensionValues?.[0]?.value ?? '(unknown)',
        sessions,
        users: parseInt(row.metricValues?.[1]?.value ?? '0'),
        percentage:
          totalDeviceSessions > 0 ? Math.round((sessions / totalDeviceSessions) * 100) : 0,
      }
    })

    return {
      totalSessions,
      totalUsers,
      totalPageViews,
      totalConversions,
      averageSessionDuration,
      bounceRate,
      growthRate,
      topTrafficSources,
      deviceBreakdown,
      dailyMetrics,
    }
  } catch (error) {
    console.error('GA4 API error:', error)
    return null
  }
}
