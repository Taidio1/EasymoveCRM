import { NextResponse } from 'next/server'
import { getAdsData, isAdsConfigured } from '@/lib/ads-service'

const generateMockAdsData = () => {
  const today = new Date()
  const dailyMetrics = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const clicks = Math.round(15 + Math.random() * 20)
    const impressions = Math.round(clicks * (8 + Math.random() * 6))
    const costPln = Math.round((clicks * (2.5 + Math.random() * 2)) * 100) / 100
    const conversions = Math.round(clicks * (0.05 + Math.random() * 0.1))
    dailyMetrics.push({
      date: date.toISOString().split('T')[0],
      clicks,
      impressions,
      costPln,
      conversions,
    })
  }

  const totalClicks = dailyMetrics.reduce((s, d) => s + d.clicks, 0)
  const totalImpressions = dailyMetrics.reduce((s, d) => s + d.impressions, 0)
  const totalCostPln = Math.round(dailyMetrics.reduce((s, d) => s + d.costPln, 0) * 100) / 100
  const totalConversions = dailyMetrics.reduce((s, d) => s + d.conversions, 0)

  return {
    totalClicks,
    totalImpressions,
    totalCostPln,
    totalConversions,
    ctr: Math.round((totalClicks / totalImpressions) * 10000) / 100,
    averageCpc: Math.round((totalCostPln / totalClicks) * 100) / 100,
    costPerConversion: totalConversions > 0 ? Math.round((totalCostPln / totalConversions) * 100) / 100 : 0,
    conversionRate: Math.round((totalConversions / totalClicks) * 10000) / 100,
    clickGrowthRate: 18,
    topCampaigns: [
      { name: 'Pobyt czasowy - Ukraina', clicks: 210, impressions: 3100, costPln: 630, conversions: 18, ctr: 6.77 },
      { name: 'Zezwolenie na pracę', clicks: 145, impressions: 2400, costPln: 435, conversions: 11, ctr: 6.04 },
      { name: 'Karta pobytu', clicks: 98, impressions: 1800, costPln: 294, conversions: 7, ctr: 5.44 },
      { name: 'Legalizacja pobytu', clicks: 67, impressions: 1200, costPln: 201, conversions: 5, ctr: 5.58 },
      { name: 'Remarketing', clicks: 43, impressions: 890, costPln: 86, conversions: 4, ctr: 4.83 },
    ],
    deviceBreakdown: [
      { device: 'mobile', clicks: Math.round(totalClicks * 0.62), percentage: 62 },
      { device: 'desktop', clicks: Math.round(totalClicks * 0.31), percentage: 31 },
      { device: 'tablet', clicks: Math.round(totalClicks * 0.07), percentage: 7 },
    ],
    dailyMetrics,
  }
}

export async function GET() {
  try {
    if (isAdsConfigured()) {
      const realData = await getAdsData()
      if (realData) {
        return NextResponse.json({ success: true, data: realData, source: 'google_ads', lastUpdated: new Date().toISOString() })
      }
    }

    return NextResponse.json({
      success: true,
      data: generateMockAdsData(),
      source: 'mock',
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Ads API error:', error)
    return NextResponse.json({ success: false, error: 'Nie udało się pobrać danych Google Ads' }, { status: 500 })
  }
}

export const revalidate = 3600
