"use client"

import { useState } from "react"
import { supabase } from "@/lib/superbase"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"

export function InquiryForm() {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const onSend = async () => {
    setSending(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch("/api/panel/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Wysłano", description: "Twoje zapytanie trafiło do opiekuna." })
      setMessage("")
    } catch {
      toast({ title: "Błąd", description: "Nie udało się wysłać zapytania.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Wiadomości</h1>
      <p className="text-sm text-text-mute">Masz pytanie do swojej sprawy? Napisz do opiekuna —
        odpowiemy mailowo lub telefonicznie.</p>
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Treść zapytania..." className="min-h-[140px]" />
      <Button className="w-full" onClick={onSend} disabled={sending || message.trim().length < 5}>
        {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wysyłanie...</>
          : <><Send className="mr-2 h-4 w-4" />Wyślij zapytanie</>}
      </Button>
    </div>
  )
}
