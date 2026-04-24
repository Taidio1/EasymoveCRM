import { Client } from "@/lib/superbase"

// Typy wydarzeń kalendarza
export type CalendarEventType = 
  | "visa_expiration"           // Data wygaśnięcia wizy
  | "residence_permit_expiration" // Data wygaśnięcia karty pobytu
  | "decision_pickup"           // Termin odbioru decyzji
  | "residence_permit_pickup"   // Termin odbioru karty pobytu
  | "application_submission"    // Termin złożenia wniosku o przedłużenie
  | "application_issued"        // Data wydania wniosku
  | "office_visit"              // Terminy wizyt w urzędach

export interface CalendarEvent {
  id: string
  clientId: string
  clientName: string
  type: CalendarEventType
  date: Date
  title: string
  description?: string
  color: string
  priority: "low" | "medium" | "high"
}

// Mapowanie typów wydarzeń na kolory (klasy Tailwind)
export const eventTypeColors: Record<CalendarEventType, string> = {
  visa_expiration: "bg-red-500",
  residence_permit_expiration: "bg-orange-500",
  decision_pickup: "bg-blue-500",
  residence_permit_pickup: "bg-green-500",
  application_submission: "bg-purple-500",
  application_issued: "bg-indigo-500",
  office_visit: "bg-yellow-500",
}

// Mapowanie typów wydarzeń na kolory hex (dla inline styles)
export const eventTypeColorsHex: Record<CalendarEventType, string> = {
  visa_expiration: "#ef4444",
  residence_permit_expiration: "#f97316",
  decision_pickup: "#3b82f6",
  residence_permit_pickup: "#22c55e",
  application_submission: "#a855f7",
  application_issued: "#6366f1",
  office_visit: "#eab308",
}

// Mapowanie typów wydarzeń na nazwy
export const eventTypeLabels: Record<CalendarEventType, string> = {
  visa_expiration: "Wygaśnięcie wizy",
  residence_permit_expiration: "Wygaśnięcie karty pobytu",
  decision_pickup: "Odbior decyzji",
  residence_permit_pickup: "Odbior karty pobytu",
  application_submission: "Złożenie wniosku",
  application_issued: "Wydanie wniosku",
  office_visit: "Wizyta w urzędzie",
}

// Funkcja mapująca klientów na wydarzenia kalendarza
export function mapClientsToEvents(clients: Client[]): CalendarEvent[] {
  const events: CalendarEvent[] = []

  clients.forEach((client) => {
    // Data zakończenia legalnego pobytu (wygaśnięcie wizy)
    if (client.DataZakLegPob) {
      events.push({
        id: `visa_exp_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "visa_expiration",
        date: new Date(client.DataZakLegPob),
        title: `Wygaśnięcie wizy - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.visa_expiration,
        priority: "high",
      })
    }

    // Data odbioru karty pobytu (może być też terminem wygaśnięcia)
    if (client.DataOdbKartyPob) {
      events.push({
        id: `res_perm_pickup_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "residence_permit_pickup",
        date: new Date(client.DataOdbKartyPob),
        title: `Odbior karty pobytu - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.residence_permit_pickup,
        priority: "medium",
      })
    }

    // Data odbioru decyzji
    if (client.DataOdbDecyzji) {
      events.push({
        id: `decision_pickup_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "decision_pickup",
        date: new Date(client.DataOdbDecyzji),
        title: `Odbior decyzji - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.decision_pickup,
        priority: "medium",
      })
    }

    // Data złożenia wniosku
    if (client.DataZloWnio) {
      events.push({
        id: `app_submission_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "application_submission",
        date: new Date(client.DataZloWnio),
        title: `Złożenie wniosku - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.application_submission,
        priority: "low",
      })
    }

    // Data wydania wniosku
    if (client.DataWydWni) {
      events.push({
        id: `app_issued_${client.id}`,
        clientId: client.id,
        clientName: client.Name,
        type: "application_issued",
        date: new Date(client.DataWydWni),
        title: `Wydanie wniosku - ${client.Name}`,
        description: `Klient: ${client.Name}`,
        color: eventTypeColorsHex.application_issued,
        priority: "low",
      })
    }
  })

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}
