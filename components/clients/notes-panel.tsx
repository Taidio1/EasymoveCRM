"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Client } from "@/lib/superbase"
import { User, MessageSquare, Send, MoreHorizontal } from "lucide-react"

interface NoteProps {
  author: string
  date: string
  content: string
}

function NoteItem({ author, date, content }: NoteProps) {
  return (
    <div className="p-4 rounded-card border border-border bg-surface/30 flex flex-col gap-2 transition-colors hover:bg-surface/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
            <User className="h-3 w-3 text-brand" />
          </div>
          <span className="text-xs font-semibold text-text">{author}</span>
          <span className="text-[10px] text-text-mute font-mono uppercase">{date}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-text-mute hover:text-text">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}

interface NotesPanelProps {
  client: Client
}

export function NotesPanel({ client }: NotesPanelProps) {
  const [newNote, setNewNote] = useState("")

  // Mocked notes list + existing client.Notes
  const notes = [
    {
      author: "Anna Kowalska",
      date: "Dzisiaj, 10:30",
      content: "Klient dostarczył brakujące zaświadczenie o niekaralności. Dokument został zeskanowany i dodany do folderu."
    },
    {
      author: "Marek Nowak",
      date: "Wczoraj, 14:15",
      content: "Kontakt telefoniczny z klientem. Poinformowano o konieczności opłacenia brakującej kwoty za pełnomocnictwo."
    }
  ]

  // Add client.Notes as the oldest note if it exists
  if (client.Notes) {
    notes.push({
      author: client.Creator || "System",
      date: client.CreatedDate ? new Date(client.CreatedDate).toLocaleDateString('pl-PL') : "Początek",
      content: client.Notes
    })
  }

  const handleSubmitNote = () => {
    if (!newNote.trim()) return
    // Here we would normally call an API to save the note
    console.log("Saving note:", newNote)
    setNewNote("")
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-mute flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Ostatnie Notatki
        </CardTitle>
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-border-strong hover:bg-surface">
          Zobacz wszystkie
        </Button>
      </CardHeader>
      <CardContent className="px-0 flex flex-col gap-6">
        {/* Add Note Area */}
        <div className="relative group">
          <Textarea 
            placeholder="Dodaj nową notatkę..." 
            className="min-h-[100px] resize-none border-border-strong focus-visible:ring-brand/30 bg-surface/20 focus:bg-surface/50 transition-all rounded-card pr-12 text-sm pt-4"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button 
            size="icon" 
            className="absolute bottom-3 right-3 h-8 w-8 rounded-btn bg-brand hover:bg-brand-hover shadow-btn-primary transition-all scale-90 opacity-0 group-focus-within:scale-100 group-focus-within:opacity-100"
            onClick={handleSubmitNote}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Notes List */}
        <div className="flex flex-col gap-4">
          {notes.map((note, index) => (
            <NoteItem 
              key={index}
              author={note.author}
              date={note.date}
              content={note.content}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
