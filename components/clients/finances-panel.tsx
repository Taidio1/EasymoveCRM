import { type Client } from "@/lib/superbase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface FinancesPanelProps {
  client: Client
}

export function FinancesPanel({ client }: FinancesPanelProps) {
  const totalSpendStr = client.TotalSpend?.replace(/[^\d.-]/g, '') || "0"
  const total = parseFloat(totalSpendStr) || 0
  
  let paid = 0
  if (client.StatusPla?.toLowerCase().includes("opłacon") || client.StatusPla?.toLowerCase().includes("zapłacon")) {
    paid = total
  } else if (client.StatusPla?.toLowerCase().includes("zaliczka")) {
    paid = total * 0.5
  }
  
  const remaining = total - paid
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finanse</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-text-mute">Status</span>
            {client.StatusPla ? (
               <Badge variant={client.StatusPla.toLowerCase().includes("opłacon") || client.StatusPla.toLowerCase().includes("zapłacon") ? "success" : "warn"}>
                 {client.StatusPla}
               </Badge>
            ) : (
               <span className="font-semibold text-text">Brak danych</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-mute">Opłacono {percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-text-mute">Wartość całkowita</span>
            <span className="font-semibold text-text">{total.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-text-mute">Zapłacono</span>
            <span className="font-semibold text-success">{paid.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-text-mute">Pozostało</span>
            <span className="font-semibold text-text">{remaining.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
