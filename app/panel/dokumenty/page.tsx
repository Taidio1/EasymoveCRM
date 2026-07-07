"use client"

import { useEffect, useState } from "react"
import { getMyClient } from "@/lib/panel/client-self"
import type { Client } from "@/lib/superbase"
import { DocList } from "@/components/panel/doc-list"
import { Loader2 } from "lucide-react"

export default function DokumentyPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getMyClient().then((c) => { setClient(c); setLoading(false) }) }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand" /></div>
  if (!client) return <p className="text-sm text-text-mute py-16 text-center">Nie znaleziono Twojej sprawy.</p>
  return <DocList client={client} />
}
