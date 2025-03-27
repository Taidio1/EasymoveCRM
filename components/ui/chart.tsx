"use client"

import type * as React from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line,
  Bar,
  ComposedChart,
  ResponsiveContainer,
} from "recharts"

interface ChartProps {
  children: React.ReactNode
}

export function Chart({ children }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={[]}>{children}</ComposedChart>
    </ResponsiveContainer>
  )
}

interface ChartContainerProps {
  children: React.ReactNode
}

export function ChartContainer({ children }: ChartContainerProps) {
  return <>{children}</>
}

interface ChartTooltipContentProps {
  label?: string
  payload?: any[]
}

export function ChartTooltipContent({ label, payload }: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) return null

  return (
    <div className="rounded-md border p-2 bg-background">
      {label && <div className="text-sm font-medium">{label}</div>}
      {payload.map((item, index) => (
        <div key={index} className="text-xs">
          <span style={{ color: item.color }} className="font-bold">
            {item.name}:
          </span>{" "}
          {item.value}
        </div>
      ))}
    </div>
  )
}

export const ChartTooltip = ({ children }: { children: React.ReactNode }) => <Tooltip content={ChartTooltipContent} />

interface ChartLegendProps {
  children: React.ReactNode
}

export function ChartLegend({ children }: ChartLegendProps) {
  return <Legend content={children} />
}

interface ChartLegendItemProps {
  name: string
  color: string
}

export function ChartLegendItem({ name, color }: ChartLegendItemProps) {
  return (
    <span className="inline-flex items-center">
      <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
      {name}
    </span>
  )
}

export const ChartGrid = CartesianGrid

export const ChartXAxis = XAxis

export const ChartYAxis = YAxis

export const ChartArea = Area

export const ChartLine = Line

export const ChartBar = Bar

