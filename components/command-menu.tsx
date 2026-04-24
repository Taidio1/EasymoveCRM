"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Moon,
  Sun,
  Laptop
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

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Wpisz polecenie lub szukaj..." />
      <CommandList>
        <CommandEmpty>Brak wyników.</CommandEmpty>
        <CommandGroup heading="Nawigacja">
          <CommandItem onSelect={() => { router.push("/"); setOpen(false) }}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Pulpit</span>
          </CommandItem>
          <CommandItem onSelect={() => { router.push("/clients"); setOpen(false) }}>
            <Users className="mr-2 h-4 w-4" />
            <span>Klienci</span>
          </CommandItem>
          <CommandItem onSelect={() => { router.push("/calendar"); setOpen(false) }}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Terminy</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Motyw">
          <CommandItem onSelect={() => { setTheme("light"); setOpen(false) }}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Jasny</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); setOpen(false) }}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Ciemny</span>
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); setOpen(false) }}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>Systemowy</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
