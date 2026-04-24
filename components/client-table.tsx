"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { MoreHorizontal, Loader2, ArrowUpDown, ChevronUp, ChevronDown, FileText, Globe, Home, Briefcase, Map, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CreateClientModal } from "./create-client-modal"
import { toast } from "@/hooks/use-toast"
import { type Client, getClients, deleteClient } from "@/lib/superbase"
import { cn } from "@/lib/utils"
import { FilterBar } from "@/components/clients/filter-bar"

// Funkcja do formatowania daty
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return "—";
  }
};

const getUrgency = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getCaseType = (cel: string | null) => {
  if (!cel) return "pobyt";
  const c = cel.toLowerCase();
  if (c.includes("wiza")) return "visa";
  if (c.includes("pobyt") || c.includes("karta") || c.includes("zezwolenie na pobyt")) return "pobyt";
  if (c.includes("obywatelstwo")) return "obywatelstwo";
  if (c.includes("praca") || c.includes("zezwolenie na pracę")) return "praca";
  return "pobyt";
};

const getCaseIcon = (type: string) => {
  switch (type) {
    case "visa": return <Map className="h-3.5 w-3.5" />;
    case "pobyt": return <Home className="h-3.5 w-3.5" />;
    case "obywatelstwo": return <Globe className="h-3.5 w-3.5" />;
    case "praca": return <Briefcase className="h-3.5 w-3.5" />;
    default: return <Home className="h-3.5 w-3.5" />;
  }
};

const getInitials = (name: string | null) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const getFlagEmoji = (countryName: string | null) => {
  if (!countryName) return "🏳️";
  const name = countryName.toLowerCase();
  if (name.includes("polska")) return "🇵🇱";
  if (name.includes("ukraina")) return "🇺🇦";
  if (name.includes("białoruś")) return "🇧🇾";
  if (name.includes("indie")) return "🇮🇳";
  if (name.includes("gruzja")) return "🇬🇪";
  if (name.includes("rosja")) return "🇷🇺";
  if (name.includes("mołdawia")) return "🇲🇩";
  return "🏳️";
};

const getDocumentsStatus = (client: Client) => {
  const docs = [
    client.FormWni,
    client.ZalNrJed,
    client.KopiaPasz,
    client.ZalBlue,
    client.CzteZdjecia,
    client.Pelnomocnictwo
  ];
  const allReady = docs.every(doc => doc === true);
  return allReady ? 'success' : 'warn';
};

type SortConfig = {
  key: keyof Client;
  direction: 'asc' | 'desc';
} | null;

export default function ClientTable() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeStatusFilter, setActiveStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'DataZloWnio', direction: 'desc' })

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

  const handleClientCreated = (newClient: Client) => {
    setClients((prevClients) => [newClient, ...prevClients])
  }

  const handleRowClick = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można cofnąć.")) {
      try {
        const success = await deleteClient(clientId)
        if (success) {
          setClients((prevClients) => prevClients.filter((client) => client.id !== clientId))
          toast({
            title: "Klient usunięty",
            description: "Klient został pomyślnie usunięty.",
          })
        } else {
          throw new Error("Nie udało się usunąć klienta")
        }
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć klienta.",
          variant: "destructive",
        })
      }
    }
  }

  const counts = useMemo(() => {
    return {
      all: clients.length,
      urgent: clients.filter(c => {
        const urg = getUrgency(c.DataZloWnio);
        return urg !== null && urg <= 2;
      }).length,
      active: clients.filter(c => c.Status?.toLowerCase() === 'w trakcie').length,
      pending: clients.filter(c => c.Status?.toLowerCase() === 'zaplanowany').length,
    }
  }, [clients])

  const handleSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.NumerSprawy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.Phone?.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesStatus = true;
      if (activeStatusFilter === "urgent") {
        const urgency = getUrgency(client.DataZloWnio);
        matchesStatus = urgency !== null && urgency <= 2;
      } else if (activeStatusFilter === "active") {
        matchesStatus = client.Status?.toLowerCase() === "w trakcie";
      } else if (activeStatusFilter === "pending") {
        matchesStatus = client.Status?.toLowerCase() === "zaplanowany";
      }

      const matchesCompletedFilter = showCompleted || client.Status !== "Zakończony";

      return matchesSearch && matchesStatus && matchesCompletedFilter;
    });
  }, [clients, searchTerm, activeStatusFilter, showCompleted]);

  const sortedClients = useMemo(() => {
    if (!sortConfig) return filteredClients;

    return [...filteredClients].sort((a, b) => {
      const { key, direction } = sortConfig;
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const result = aValue > bValue ? 1 : -1;
      return direction === 'asc' ? result : -result;
    });
  }, [filteredClients, sortConfig]);

  const exportToCSV = () => {
    const headers = ["Klient", "ID", "Sprawa", "Status", "Data Zlozenia", "Doradca"];
    const rows = sortedClients.map(c => [
      c.Name,
      c.id,
      c.CelPobytu,
      c.Status,
      c.DataZloWnio,
      c.Inspektor || c.Creator
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "klienci.csv");
    link.click();
  };

  const SortIcon = ({ column }: { column: keyof Client }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-3.5 w-3.5" /> : <ChevronDown className="ml-2 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Klienci</h1>
        <p className="text-sm text-text-dim">Zarządzaj sprawami i dokumentacją klientów</p>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeStatus={activeStatusFilter}
        onStatusChange={setActiveStatusFilter}
        counts={counts}
        onNewClientClick={() => setIsCreateModalOpen(true)}
      />

      <CreateClientModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onClientCreated={handleClientCreated}
      />

      <div className="bg-surface border border-border rounded-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <span className="ml-3 text-sm font-medium text-text-dim">Pobieranie danych...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface-hover/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[280px] h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute cursor-pointer select-none" onClick={() => handleSort('Name')}>
                    <div className="flex items-center">Klient <SortIcon column="Name" /></div>
                  </TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">ID</TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute cursor-pointer select-none" onClick={() => handleSort('CelPobytu')}>
                    <div className="flex items-center">Sprawa <SortIcon column="CelPobytu" /></div>
                  </TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute cursor-pointer select-none" onClick={() => handleSort('Status')}>
                    <div className="flex items-center">Etap <SortIcon column="Status" /></div>
                  </TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute cursor-pointer select-none" onClick={() => handleSort('DataZloWnio')}>
                    <div className="flex items-center">Następny termin <SortIcon column="DataZloWnio" /></div>
                  </TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">Dokumenty</TableHead>
                  <TableHead className="h-10 py-0 text-xxs font-bold uppercase tracking-loosest text-text-mute">Doradca</TableHead>
                  <TableHead className="w-[50px] h-10 py-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-text-dim">
                      Nie znaleziono klientów spełniających kryteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedClients.map((client) => {
                    const caseType = getCaseType(client.CelPobytu);
                    const urgency = getUrgency(client.DataZloWnio);
                    const docStatus = getDocumentsStatus(client);
                    
                    return (
                      <TableRow 
                        key={client.id}
                        className="group cursor-pointer hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                        onClick={() => handleRowClick(client.id)}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex items-center justify-center w-[30px] h-[30px] rounded-full shrink-0",
                              caseType === 'visa' && "bg-visa/20 text-visa",
                              caseType === 'pobyt' && "bg-pobyt/20 text-pobyt",
                              caseType === 'obywatelstwo' && "bg-obywatelstwo/20 text-obywatelstwo",
                              caseType === 'praca' && "bg-praca/20 text-praca",
                            )}>
                              {getCaseIcon(caseType)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm-plus font-semibold text-text truncate">
                                {client.Name || "Brak danych"}
                              </span>
                              <div className="flex items-center gap-1.5 text-xxs text-text-mute">
                                <span>{getFlagEmoji(client.country_name)}</span>
                                <span className="truncate">{client.country_name || "Nieznany kraj"}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-xxs text-text-mute uppercase">
                            {client.id.substring(0, 8)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              caseType === 'visa' && "bg-visa",
                              caseType === 'pobyt' && "bg-pobyt",
                              caseType === 'obywatelstwo' && "bg-obywatelstwo",
                              caseType === 'praca' && "bg-praca",
                            )} />
                            <span className="text-xs-plus text-text-dim truncate max-w-[140px]">
                              {client.CelPobytu || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={cn(
                              "rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-semi-loose border-0",
                              client.Status?.toLowerCase() === "zaplanowany"
                                ? "bg-info-soft text-info"
                                : client.Status === "Zakończony"
                                ? "bg-success-soft text-success"
                                : client.Status?.toLowerCase() === "w trakcie"
                                ? "bg-brand-soft text-brand"
                                : client.Status?.toLowerCase() === "zawieszony"
                                ? "bg-warn-soft text-warn"
                                : "bg-muted text-text-mute"
                            )}
                          >
                            {client.Status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-xs-plus font-medium",
                              urgency !== null && urgency <= 1 ? "text-danger font-semibold" : 
                              urgency !== null && urgency <= 2 ? "text-warn" : "text-text"
                            )}>
                              {formatDate(client.DataZloWnio)}
                            </span>
                            {urgency !== null && urgency <= 5 && urgency > 0 && (
                              <span className="text-[10px] text-text-mute leading-none">
                                Za {urgency} {urgency === 1 ? 'dzień' : 'dni'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-pill px-2 py-0.5 text-[10.5px] font-semibold border-0",
                              docStatus === 'success' 
                                ? "bg-success-soft text-success" 
                                : "bg-warn-soft text-warn"
                            )}
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            {docStatus === 'success' ? 'KOMPLET' : 'BRAKI'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-hover border border-border text-[10px] font-bold text-text-dim" title={client.Inspektor || client.Creator || "Brak"}>
                            {getInitials(client.Inspektor || client.Creator)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-text-mute hover:text-text hover:bg-surface-hover">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-surface-raised border-border text-text">
                              <DropdownMenuLabel className="text-xxs uppercase tracking-loosest text-text-mute">Akcje</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem onClick={() => handleRowClick(client.id)} className="text-xs-plus hover:bg-surface-hover">
                                Szczegóły klienta
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive text-xs-plus hover:bg-danger-soft" onClick={() => handleDeleteClient(client.id)}>
                                Usuń klienta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex items-center justify-between px-6 py-4 bg-surface border-t border-border">
          <div className="text-xs text-text-mute">
            Łącznie: <span className="font-semibold text-text">{sortedClients.length}</span> klientów
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xxs font-bold uppercase tracking-loosest border-border text-text-dim hover:text-text hover:bg-surface-hover"
            onClick={exportToCSV}
          >
            Eksport CSV
          </Button>
        </div>
      </div>
    </div>
  )
}