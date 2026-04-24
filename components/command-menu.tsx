"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Moon,
  Sun,
  Laptop,
  User
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { supabase, type Client } from "@/lib/superbase"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [clients, setClients] = React.useState<Client[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (query.length < 2) {
      setClients([])
      return
    }

    const searchClients = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .ilike("Name", `%${query}%`)
        .limit(10)

      if (error) {
        console.error("Error searching clients:", error)
      } else {
        setClients(data || [])
      }
      setIsLoading(false)
    }

    const timer = setTimeout(() => {
      searchClients()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Reset query and clients when menu closes
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setClients([])
    }
  }, [open])

  const handleSelect = (callback: () => void) => {
    callback()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Wpisz polecenie lub szukaj..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{isLoading ? "Szukanie..." : "Brak wyników."}</CommandEmpty>
        
        {clients.length > 0 && (
          <>
            <CommandGroup heading="Klienci">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => handleSelect(() => router.push(`/clients/${client.id}`))}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{client.Name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Nawigacja">
          <CommandItem onSelect={() => handleSelect(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Pulpit</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push("/clients"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Klienci</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Terminy</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Motyw">
          <CommandItem onSelect={() => handleSelect(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Jasny</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Ciemny</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>Systemowy</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
