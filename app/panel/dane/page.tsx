"use client"

import { useEffect, useState } from "react"
import { getMyClient } from "@/lib/panel/client-self"
import type { Client } from "@/lib/superbase"
import { ProfileForm } from "@/components/panel/profile-form"
import { Loader2 } from "lucide-react"

export default function DanePage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getMyClient().then((c) => { setClient(c); setLoading(false) }) }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand" /></div>
  if (!client) return <p className="text-sm text-text-mute py-16 text-center">Nie znaleziono Twoich danych.</p>
  return <ProfileForm client={client} />
}
