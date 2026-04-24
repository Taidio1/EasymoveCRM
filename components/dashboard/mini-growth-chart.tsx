"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts"
import { type Client } from "@/lib/superbase"

interface MiniGrowthChartProps {
  clients?: Client[]
}

export function MiniGrowthChart({ clients = [] }: MiniGrowthChartProps) {
  // Simple aggregation for the last 7 days (mock logic for demo)
  const data = [
    { day: "Pn", cases: 4 },
    { day: "Wt", cases: 7 },
    { day: "Śr", cases: 5 },
    { day: "Cz", cases: 8 },
    { day: "Pt", cases: 6 },
    { day: "So", cases: 3 },
    { day: "Nd", cases: 2 },
  ]

  return (
    <Card className="bg-surface border-border shadow-none overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
          Wzrost spraw (7 dni)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[120px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "var(--text-mute)" }} 
              dy={5}
            />
            <Tooltip 
              cursor={{ fill: 'var(--surface-hover)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface-raised border border-border px-2 py-1 rounded-chip shadow-modal">
                      <p className="text-xs font-bold text-brand">{payload[0].value} wniosków</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="cases" 
              fill="var(--brand)" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
