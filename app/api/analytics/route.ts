import { NextRequest, NextResponse } from 'next/server';

// Mockowane dane dla celów demonstracyjnych
// W rzeczywistości tutaj byłyby wywołania do analyticsService
const generateMockAnalyticsData = () => {
  const today = new Date();
  const dailyMetrics = [];
  
  // Generuj dane za ostatnie 30 dni
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseSessions = 50;
    const randomFactor = Math.random() * 0.5 + 0.75; // 75-125% base
    
    dailyMetrics.push({
      date: date.toISOString().split('T')[0],
      sessions: Math.round(baseSessions * randomFactor),
      users: Math.round(baseSessions * randomFactor * 0.8),
      newUsers: Math.round(baseSessions * randomFactor * 0.3),
      pageViews: Math.round(baseSessions * randomFactor * 2.5),
      averageSessionDuration: Math.round((120 + Math.random() * 180)), // 2-5 minut
      bounceRate: Math.round((30 + Math.random() * 40)), // 30-70%
      conversions: Math.round(baseSessions * randomFactor * 0.05) // 5% conversion rate
    });
  }
  
  return {
    totalSessions: dailyMetrics.reduce((sum, day) => sum + day.sessions, 0),
    totalUsers: dailyMetrics.reduce((sum, day) => sum + day.users, 0),
    totalPageViews: dailyMetrics.reduce((sum, day) => sum + day.pageViews, 0),
    totalConversions: dailyMetrics.reduce((sum, day) => sum + day.conversions, 0),
    averageSessionDuration: 180,
    bounceRate: 45,
    growthRate: 12, // +12%
    topTrafficSources: [
      { source: 'google', medium: 'organic', sessions: 850, users: 720, percentage: 45 },
      { source: 'direct', medium: '(none)', sessions: 420, users: 380, percentage: 22 },
      { source: 'facebook', medium: 'social', sessions: 310, users: 290, percentage: 16 },
      { source: 'google', medium: 'cpc', sessions: 180, users: 165, percentage: 9 },
      { source: 'linkedin', medium: 'social', sessions: 150, users: 140, percentage: 8 }
    ],
    deviceBreakdown: [
      { deviceCategory: 'mobile', sessions: 1200, users: 1050, percentage: 63 },
      { deviceCategory: 'desktop', sessions: 580, users: 520, percentage: 30 },
      { deviceCategory: 'tablet', sessions: 130, users: 115, percentage: 7 }
    ],
    dailyMetrics
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Zastąp mockowanymi danymi prawdziwymi z analyticsService
    const analyticsData = generateMockAnalyticsData();
    
    return NextResponse.json({
      success: true,
      data: analyticsData,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Błąd API analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nie udało się pobrać danych analitycznych' 
      },
      { status: 500 }
    );
  }
}

// Cache na 1 godzinę
export const revalidate = 3600; 