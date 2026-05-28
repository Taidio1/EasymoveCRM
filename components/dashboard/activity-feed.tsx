import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FileText, UserPlus, CheckCircle2, MessageSquare } from "lucide-react"
import { type Client } from "@/lib/superbase"

interface Activity {
  id: string
  type: 'client' | 'document' | 'task' | 'comment'
  user: string
  action: string
  target: string
  time: string
}

interface ActivityFeedProps {
  clients?: Client[]
}

export function ActivityFeed({ clients = [] }: ActivityFeedProps) {
  // Map real clients to activity format
  const activities: Activity[] = clients.slice(0, 4).map((c, i) => ({
    id: c.id,
    type: (i === 0 ? "client" : i === 1 ? "document" : i === 2 ? "task" : "comment") as any,
    user: c.Creator || "System",
    action: i === 0 ? "dodał(a) nowego klienta" : i === 1 ? "wygenerował(a) dokument" : i === 2 ? "zmienił(a) status sprawy" : "dodał(a) notatkę do",
    target: c.Name,
    time: "niedawno"
  }))

  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h2 className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
            Ostatnia aktywność
          </h2>
          <button className="text-xs text-text-mute hover:text-brand transition-colors">
            Więcej →
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {activities.length > 0 ? activities.map((activity) => (
            <div key={activity.id} className="relative pl-10 group">
              <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center z-10 group-hover:border-brand group-hover:text-brand transition-colors">
                {activity.type === 'client' && <UserPlus className="h-3.5 w-3.5" />}
                {activity.type === 'document' && <FileText className="h-3.5 w-3.5" />}
                {activity.type === 'task' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {activity.type === 'comment' && <MessageSquare className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-text leading-snug">
                  <span className="font-bold">{activity.user}</span> {activity.action}{" "}
                  <span className="font-semibold text-brand">{activity.target}</span>
                </p>
                <span className="text-2xs text-text-mute uppercase tracking-wider">{activity.time}</span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground py-4 text-center pl-10">Brak ostatnich aktywności.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
