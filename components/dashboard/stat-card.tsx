import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down'
  colorClass: string
  subtitle?: string
}

export function StatCard({ label, value, delta, trend, colorClass, subtitle }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-card p-4 relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", colorClass)} />
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-text-mute uppercase tracking-semi-loose">{label}</span>
        {delta && (
          <div className={cn("px-1.5 py-0.5 rounded-pill text-[10.5px] font-bold", 
            trend === 'up' ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {delta}
          </div>
        )}
      </div>
      <div className="text-[28px] font-bold text-text leading-none tracking-tight">
        {value}
      </div>
      {subtitle && (
        <p className="text-[11px] text-text-mute mt-2">{subtitle}</p>
      )}
    </div>
  )
}
