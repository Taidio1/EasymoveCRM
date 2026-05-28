import { GoogleAdsApi } from 'google-ads-api'

export interface AdsData {
  totalClicks: number
  totalImpressions: number
  totalCostPln: number
  totalConversions: number
  ctr: number
  averageCpc: number
  costPerConversion: number
  conversionRate: number
  clickGrowthRate: number
  topCampaigns: Array<{
    name: string
    clicks: number
    impressions: number
    costPln: number
    conversions: number
    ctr: number
  }>
  deviceBreakdown: Array<{
    device: string
    clicks: number
    percentage: number
  }>
  dailyMetrics: Array<{
    date: string
    clicks: number
    impressions: number
    costPln: number
    conversions: number
  }>
}

const DEVICE_LABELS: Record<string, string> = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  CONNECTED_TV: 'tv',
  OTHER: 'inne',
}

export function isAdsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID
  )
}

function createClient() {
  return new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  })
}

function microsToPln(micros: number | string | null | undefined): number {
  const val = Number(micros ?? 0)
  return Math.round((val / 1_000_000) * 100) / 100
}

export async function getAdsData(): Promise<AdsData | null> {
  if (!isAdsConfigured()) return null

  const client = createClient()
  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  })

  try {
    const [summaryRows, dailyRows, campaignRows, deviceRows, prevRows] = await Promise.all([
      // Podsumowanie 30 dni
      customer.query(`
        SELECT
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_per_conversion
        FROM customer
        WHERE segments.date DURING LAST_30_DAYS
      `),

      // Dzienne metryki
      customer.query(`
        SELECT
          segments.date,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions
        FROM customer
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY segments.date ASC
      `),

      // Top kampanie
      customer.query(`
        SELECT
          campaign.name,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status = 'ENABLED'
        ORDER BY metrics.clicks DESC
        LIMIT 5
      `),

      // Podział na urządzenia
      customer.query(`
        SELECT
          segments.device,
          metrics.clicks
        FROM customer
        WHERE segments.date DURING LAST_30_DAYS
          AND segments.device IN ('MOBILE', 'DESKTOP', 'TABLET')
      `),

      // Poprzedni okres (do growthRate)
      customer.query(`
        SELECT metrics.clicks
        FROM customer
        WHERE segments.date DURING LAST_60_DAYS
          AND segments.date NOT_DURING LAST_30_DAYS
      `),
    ])

    // Podsumowanie
    const s = summaryRows[0]?.metrics ?? {}
    const totalClicks = Number(s.clicks ?? 0)
    const totalImpressions = Number(s.impressions ?? 0)
    const totalCostPln = microsToPln(s.cost_micros as number)
    const totalConversions = Number(s.conversions ?? 0)
    const ctr = Math.round(Number(s.ctr ?? 0) * 10000) / 100 // jako %
    const averageCpc = microsToPln(s.average_cpc as number)
    const costPerConversion = microsToPln(s.cost_per_conversion as number)
    const conversionRate =
      totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0

    // Growth rate vs poprzedni okres
    const prevClicks = prevRows.reduce((sum: number, r: any) => sum + Number(r.metrics?.clicks ?? 0), 0)
    const clickGrowthRate =
      prevClicks > 0 ? Math.round(((totalClicks - prevClicks) / prevClicks) * 100) : 0

    // Dzienne metryki
    const dailyMetrics = dailyRows.map((row: any) => ({
      date: String(row.segments?.date ?? ''),
      clicks: Number(row.metrics?.clicks ?? 0),
      impressions: Number(row.metrics?.impressions ?? 0),
      costPln: microsToPln(row.metrics?.cost_micros),
      conversions: Number(row.metrics?.conversions ?? 0),
    }))

    // Kampanie
    const topCampaigns = campaignRows.map((row: any) => ({
      name: String(row.campaign?.name ?? ''),
      clicks: Number(row.metrics?.clicks ?? 0),
      impressions: Number(row.metrics?.impressions ?? 0),
      costPln: microsToPln(row.metrics?.cost_micros),
      conversions: Number(row.metrics?.conversions ?? 0),
      ctr: Math.round(Number(row.metrics?.ctr ?? 0) * 10000) / 100,
    }))

    // Urządzenia
    const deviceMap: Record<string, number> = {}
    for (const row of deviceRows as any[]) {
      const dev = String(row.segments?.device ?? 'OTHER')
      deviceMap[dev] = (deviceMap[dev] ?? 0) + Number(row.metrics?.clicks ?? 0)
    }
    const totalDeviceClicks = Object.values(deviceMap).reduce((a, b) => a + b, 0)
    const deviceBreakdown = Object.entries(deviceMap)
      .map(([dev, clicks]) => ({
        device: DEVICE_LABELS[dev] ?? dev.toLowerCase(),
        clicks,
        percentage: totalDeviceClicks > 0 ? Math.round((clicks / totalDeviceClicks) * 100) : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)

    return {
      totalClicks,
      totalImpressions,
      totalCostPln,
      totalConversions,
      ctr,
      averageCpc,
      costPerConversion,
      conversionRate,
      clickGrowthRate,
      topCampaigns,
      deviceBreakdown,
      dailyMetrics,
    }
  } catch (error) {
    console.error('Google Ads API error:', error)
    return null
  }
}
