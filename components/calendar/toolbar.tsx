"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarToolbarProps {
  view: "day" | "week" | "month" | "list"
  onViewChange: (view: "day" | "week" | "month" | "list") => void
  dateHeader: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarToolbar({
  view,
  onViewChange,
  dateHeader,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-[28px] w-[28px] rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-[28px] w-[28px] rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-[15px] font-semibold min-w-[140px] text-center sm:text-left px-2">
          {dateHeader}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToday}
          className="h-8 text-xs font-medium px-3 rounded-md border-muted-foreground/20"
        >
          Dzisiaj
        </Button>
      </div>

      {/* Center/Right: View switcher and Action */}
      <div className="flex items-center gap-3">
        <Tabs 
          value={view} 
          onValueChange={(v) => onViewChange(v as any)}
          className="bg-muted p-0.5 rounded-lg"
        >
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger 
              value="day" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Dzień
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Tydzień
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Miesiąc
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          size="sm" 
          className="h-8 gap-1.5 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Nowy termin</span>
        </Button>
      </div>
    </div>
  )
}
