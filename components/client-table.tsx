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
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateClientModal } from "./create-client-modal"
import { ClientDetailsModal } from "./client-details-modal"
import { toast } from "@/hooks/use-toast"
import { type Client, getClients, deleteClient } from "@/lib/superbase"

// Dodaj funkcjÃª formatujÂ¹cÂ¹ datÃª na poczÂ¹tku komponentu, po deklaracji stanÃ³w
// Funkcja do formatowania daty bez strefy czasowej
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Brak danych";
  
  // Sprawdzenie czy data zawiera format GMT
  if (dateString.includes("GMT")) {
    // UsuÃ± informacjÃª o strefie czasowej
    return dateString.split(" (")[0];
  }
  
  return dateString;
};

export default function ClientTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  // Pobieranie klientÃ³w z Supabase
  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      try {
        const data = await getClients()
        setClients(data)
      } catch (error) {
        console.error("BÂ³Â¹d podczas pobierania klientÃ³w:", error)
        toast({
          title: "BÂ³Â¹d",
          description: "Nie udaÂ³o siÃª pobraÃ¦ listy klientÃ³w. SprÃ³buj ponownie pÃ³Âniej.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // OdÂwieÂ¿anie listy klientÃ³w
  const refreshClients = async () => {
    setIsLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error("BÂ³Â¹d podczas odÂwieÂ¿ania klientÃ³w:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  

  // ObsÂ³uga dodawania nowego klienta
  const handleClientCreated = (newClient: Client) => {
    setClients((prevClients) => [newClient, ...prevClients])
  }

  // ObsÂ³uga wyÂwietlania szczegÃ³Â³Ã³w klienta
  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsModalOpen(true)
  }

  // ObsÂ³uga aktualizacji klienta
  const handleClientUpdated = (updatedClient: Client) => {
    console.log("Klient przed aktualizacjÂ¹ w tabeli:", selectedClient);
    console.log("Zaktualizowany klient przekazany do tabeli:", updatedClient);
    console.log("Status dokumentÃ³w klienta:", {
      FormWni: updatedClient.FormWni,
      ZalNrJed: updatedClient.ZalNrJed,
      KopiaPasz: updatedClient.KopiaPasz,
      ZalBlue: updatedClient.ZalBlue,
      CzteZdjecia: updatedClient.CzteZdjecia,
      Pelnomocnictwo: updatedClient.Pelnomocnictwo,
    });
    
    setClients((prevClients) => prevClients.map((client) => {
      if (client.id === updatedClient.id) {
        console.log("Aktualizacja klienta w tabeli:", client.Name);
        return updatedClient;
      }
      return client;
    }));
    
    setSelectedClient(updatedClient);
  }

  // ObsÂ³uga usuwania klienta
  const handleDeleteClient = async (clientId: string) => {
    // Potwierdzenie usuniÃªcia
    if (window.confirm("Czy na pewno chcesz usunÂ¹Ã¦ tego klienta? Tej operacji nie moÂ¿na cofnÂ¹Ã¦.")) {
      try {
        const success = await deleteClient(clientId)

        if (success) {
          // Aktualizacja listy klientÃ³w
          setClients((prevClients) => prevClients.filter((client) => client.id !== clientId))

          // Komunikat o powodzeniu
          toast({
            title: "Klient usuniÃªty",
            description: "Klient zostaÂ³ pomyÂlnie usuniÃªty.",
          })
        } else {
          throw new Error("Nie udaÂ³o siÃª usunÂ¹Ã¦ klienta")
        }
      } catch (error) {
        console.error("BÂ³Â¹d podczas usuwania klienta:", error)
        toast({
          title: "BÂ³Â¹d",
          description: "Nie udaÂ³o siÃª usunÂ¹Ã¦ klienta. SprÃ³buj ponownie pÃ³Âniej.",
          variant: "destructive",
        })
      }
    }
  }


  // Filtrowanie klientÃ³w na podstawie wyszukiwania i statusu
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
    
    // SprawdÂ czy klient powinien byÃ¦ wyÂwietlany zgodnie z filtrem "zakoÃ±czonych"
    const matchesCompletedFilter = showCompleted || client.Status?.toLowerCase() !== "zakoÃ±czony"

    return matchesSearch && matchesStatus && matchesCompletedFilter
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Klienci</h1>
        <p className="text-muted-foreground">ZarzÂ¹dzaj swoimi klientami i ich danymi</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Szukaj klientÃ³w..."
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
              <SelectItem value="w trakcie">W trakcie</SelectItem>
              <SelectItem value="zakoÃ±czony">zakoÃ±czony</SelectItem>
              <SelectItem value="nieaktywny">Nieaktywny</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={showCompleted ? "show" : "hide"} 
            onValueChange={(value) => setShowCompleted(value === "show")}
          >
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="PokaÂ¿ zakoÃ±czone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hide">Ukryj zakoÃ±czone</SelectItem>
              <SelectItem value="show">PokaÂ¿ zakoÃ±czone</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={refreshClients}>
            <RefreshCw size={16}  />
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

      {/* Modalne okno szczegÃ³Â³Ã³w klienta */}
      <ClientDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>Lista klientÃ³w</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Â£adowanie klientÃ³w...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ImiÃª i nazwisko</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Cel Pobytu</TableHead>
                  <TableHead className="hidden md:table-cell">NumerSprawy</TableHead>
                  <TableHead className="hidden md:table-cell">Data ZÂ³oÂ¿enia Wniosku</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nie znaleziono klientÃ³w. SprÃ³buj dostosowaÃ¦ kryteria wyszukiwania.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.Name || "Brak danych"}</TableCell>
                      <TableCell>
                      <Badge
                        className={
                          client.Status?.toLowerCase() === "aktywny"
                            ? "bg-green-100 text-green-800"
                            : client.Status?.toLowerCase() === "nieaktywny" || client.Status?.toLowerCase() === "zakoÃ±czony"
                            ? "bg-red-100 text-red-800"
                            : client.Status?.toLowerCase() === "w trakcie"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {client.Status || "Brak danych"}
                      </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{client.CelPobytu || "Brak danych"}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.NumerSprawy || "Brak danych"}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(client.DataZloWnio)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>SzczegÃ³Â³y</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>Edytuj</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              UsuÃ± klienta
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
          WyÂwietlanie <strong>{filteredClients.length}</strong> z <strong>{clients.length}</strong> klientÃ³w
        </div>
          <Select value={String(itemsPerPage)} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1) // reset do pierwszej strony po zmianie
            }}>
          <SelectTrigger className="w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 na stronÃª</SelectItem>
            <SelectItem value="10">10 na stronÃª</SelectItem>
            <SelectItem value="20">20 na stronÃª</SelectItem>
            <SelectItem value="50">50 na stronÃª</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <ChevronLeft size={16} />
        </Button>

        <span className="text-sm px-2">
          Strona {currentPage} z {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

