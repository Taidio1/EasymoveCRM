import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, UserPlus, CheckCircle2, MessageSquare } from "lucide-react"

interface Activity {
  id: string
  type: 'client' | 'document' | 'task' | 'comment'
  user: string
  action: string
  target: string
  time: string
}

const activities: Activity[] = [
  { id: "1", type: "client", user: "Admin", action: "dodał nowego klienta", target: "John Doe", time: "2h temu" },
  { id: "2", type: "document", user: "Katarzyna", action: "wygenerowała dokument", target: "Wniosek o pobyt", time: "4h temu" },
  { id: "3", type: "task", user: "System", action: "zmienił status sprawy", target: "Marek Nowak", time: "1d temu" },
  { id: "4", type: "comment", user: "Marek", action: "dodał notatkę do", target: "Anna Kowalska", time: "1d temu" },
]

export function ActivityFeed() {
  return (
    <Card className="bg-surface border-border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm-plus font-bold text-text uppercase tracking-semi-loose">
          Ostatnia aktywność
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {activities.map((activity) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
