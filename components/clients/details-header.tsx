"use client"

import { ArrowLeft, Mail, Phone, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Client } from "@/lib/superbase"
import { getInitials, getFlagEmoji } from "@/lib/client-utils"

interface DetailsHeaderProps {
  client: Client
}

export function DetailsHeader({ client }: DetailsHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-header with back button */}
      <div className="flex items-center gap-2 -ml-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-text-dim hover:text-text h-8 px-2 flex items-center gap-1.5"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[13px] font-medium">Powrót</span>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* 44x44 Gradient Avatar */}
          <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
            {getInitials(client.Name)}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-text leading-none">
                {client.Name}
              </h1>
              <span className="text-xl leading-none" title={client.KrajPoch || "Nieznany"}>
                {getFlagEmoji(client.KrajPoch || client.country_name)}
              </span>
              <Badge 
                variant="outline" 
                className="uppercase text-[10px] font-bold px-1.5 py-0 h-5 border-brand/20 text-brand bg-brand-soft tracking-wider rounded-pill"
              >
                {client.Status}
              </Badge>
            </div>
            
            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs-plus text-text-dim">
              <span className="font-mono text-text-mute tracking-tight">ID: {client.id.substring(0, 8)}</span>
              <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
              <span className="font-medium text-text-dim">{client.CelPobytu || "Brak typu"}</span>
              <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
              <span className="text-text-dim">{client.KrajPoch || client.country_name || "Brak kraju"}</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
            <Mail className="mr-2 h-4 w-4" />
            E-mail
          </Button>
          <Button variant="outline" size="sm" className="h-9 px-4 text-[13px] font-medium border-border-strong hover:bg-surface-hover text-text-dim hover:text-text">
            <Phone className="mr-2 h-4 w-4" />
            Zadzwoń
          </Button>
          <Button size="sm" className="h-9 px-4 text-[13px] font-semibold bg-brand hover:bg-brand-hover text-white shadow-btn-primary border-none rounded-btn">
            <Plus className="mr-2 h-4 w-4" />
            Nowa akcja
          </Button>
        </div>
      </div>
    </div>
  )
}
