# CommandMenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `CommandMenu` component using `cmdk` and Shadcn `Command` primitives with navigation and theme toggle.

**Architecture:** A client-side component using `CommandDialog` to provide a searchable menu for navigation and theme switching. It listens for `Meta+K` / `Ctrl+K` global shortcuts.

**Tech Stack:** React, Next.js (App Router), Shadcn UI (Command), `cmdk`, `lucide-react`, `next-themes`.

---

### Task 1: Implement CommandMenu Component

**Files:**
- Create: `components/command-menu.tsx`

- [ ] **Step 1: Create the component file**

Create `components/command-menu.tsx` with the requested implementation.

```tsx
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
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit components/command-menu.tsx` (or similar check)

- [ ] **Step 3: Commit**

```bash
git add components/command-menu.tsx
git commit -m "feat(ui): implement base CommandMenu with navigation and theme toggle"
```
