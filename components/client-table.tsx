"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateClientModal } from "./create-client-modal"
import { ClientDetailsModal } from "./client-details-modal"
import { toast } from "@/hooks/use-toast"
import { type Client, getClients, deleteClient } from "@/lib/superbase"

export default function ClientTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Pobieranie klientów z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)
      } catch (error) {
        console.error("Błąd podczas pobierania klientów:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać listy klientów. Spróbuj ponownie później.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Odświeżanie listy klientów
  const refreshClients = async () => {
    setIsLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error("Błąd podczas odświeżania klientów:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obsługa dodawania nowego klienta
  const handleClientCreated = (newClient: Client) => {
    setClients((prevClients) => [newClient, ...prevClients])
  }

  // Obsługa wyświetlania szczegółów klienta
  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsModalOpen(true)
  }

  // Obsługa aktualizacji klienta
  const handleClientUpdated = (updatedClient: Client) => {
    setClients((prevClients) => prevClients.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
    setSelectedClient(updatedClient)
  }

  // Obsługa usuwania klienta
  const handleDeleteClient = async (clientId: string) => {
    // Potwierdzenie usunięcia
    if (window.confirm("Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można cofnąć.")) {
      try {
        const success = await deleteClient(clientId)

        if (success) {
          // Aktualizacja listy klientów
          setClients((prevClients) => prevClients.filter((client) => client.id !== clientId))

          // Komunikat o powodzeniu
          toast({
            title: "Klient usunięty",
            description: "Klient został pomyślnie usunięty.",
          })
        } else {
          throw new Error("Nie udało się usunąć klienta")
        }
      } catch (error) {
        console.error("Błąd podczas usuwania klienta:", error)
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć klienta. Spróbuj ponownie później.",
          variant: "destructive",
        })
      }
    }
  }

  // Filtrowanie klientów na podstawie wyszukiwania i statusu
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      client.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      client.NumerSprawy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      client.Phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false

    const matchesStatus = statusFilter === "all" || client.Status?.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Klienci</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi klientami i ich danymi</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Szukaj klientów..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filtruj po statusie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="aktywny">Aktywny</SelectItem>
              <SelectItem value="nieaktywny">Nieaktywny</SelectItem>
              <SelectItem value="w trakcie">W trakcie</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={refreshClients}>
            <SlidersHorizontal size={16} />
          </Button>
        </div>

        <Button className="w-full md:w-auto" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Dodaj nowego klienta
        </Button>
      </div>

      {/* Modalne okno tworzenia klienta */}
      <CreateClientModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onClientCreated={handleClientCreated}
      />

      {/* Modalne okno szczegółów klienta */}
      <ClientDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>Lista klientów</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Ładowanie klientów...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefon</TableHead>
                  <TableHead className="hidden md:table-cell">Kraj pochodzenia</TableHead>
                  <TableHead className="hidden md:table-cell">Numer sprawy</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nie znaleziono klientów. Spróbuj dostosować kryteria wyszukiwania.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.Name || "Brak danych"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.Status?.toLowerCase() === "aktywny"
                              ? "default"
                              : client.Status?.toLowerCase() === "nieaktywny"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {client.Status || "Brak danych"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{client.Email || "Brak danych"}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.Phone || "Brak danych"}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.KrajPoch || "Brak danych"}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.NumerSprawy || "Brak danych"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>Szczegóły</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>Edytuj</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              Usuń klienta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Wyświetlanie <strong>{filteredClients.length}</strong> z <strong>{clients.length}</strong> klientów
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8">
            2
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

