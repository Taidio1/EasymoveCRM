"use client"

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts"

interface CountriesChartProps {
  data: { country: string; count: number }[]
}

export function CountriesChart({ data }: CountriesChartProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="country"
            angle={-45}
            textAnchor="end"
            height={70}
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            name="Liczba klientów"
            fill="#4f46e5"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 