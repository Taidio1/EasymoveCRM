import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getClients, type Client } from "@/lib/superbase"

// Funkcja pomocnicza do formatowania daty
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch (error) {
    return dateString || ""
  }
}

// Funkcja do generowania nagłówka dokumentu
const addDocumentHeader = (doc: jsPDF, title: string, logoUrl?: string) => {
  // Dodaj logo jeśli dostępne
  if (logoUrl) {
    doc.addImage(logoUrl, "JPEG", 14, 10, 30, 30)
    doc.setFontSize(20)
    doc.text(title, 50, 25)
  } else {
    doc.setFontSize(20)
    doc.text(title, 14, 22)
  }

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}`, 14, 30)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)

  // Linia oddzielająca
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 35, 196, 35)
}

// Funkcja do dodawania stopki
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const footerStr = `Strona ${pageNumber} z ${totalPages}`
  const textWidth = (doc.getStringUnitWidth(footerStr)) / doc.internal.scaleFactor
  const textX = (doc.internal.pageSize.width - textWidth) / 2

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(footerStr, textX, doc.internal.pageSize.height - 10)
  doc.setTextColor(0, 0, 0)
}

// Generowanie karty klienta
export const generateClientCard = (client: Client): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Karta Klienta")

  // Dane klienta
  doc.setFontSize(16)
  doc.text(`${client.Name || "Brak danych"}`, 14, 50)

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Numer sprawy: ${client.NumerSprawy || "Brak"}`, 14, 58)
  doc.text(`Status: ${client.Status || "Brak"}`, 14, 65)
  doc.setTextColor(0, 0, 0)

  // Sekcja danych osobowych
  doc.setFontSize(14)
  doc.text("Dane osobowe", 14, 80)

  doc.setFontSize(12)
  const personalData = [
    ["Email:", client.Email || "Brak danych"],
    ["Telefon:", client.Phone || "Brak danych"],
    ["Data urodzenia:", formatDate(client.Birthday)],
    ["Kraj pochodzenia:", client.KrajPoch || "Brak danych"],
    ["Adres:", client.Adres || "Brak danych"],
    ["Firma:", client.Firma || "Brak danych"],
  ]

  autoTable(doc, {
    startY: 85,
    head: [],
    body: personalData,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 40, fontStyle: "bold" } },
  })

  // Sekcja szczegółów sprawy
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.text("Szczegóły sprawy", 14, finalY)

  doc.setFontSize(12)
  const caseDetails = [
    ["Cel pobytu:", client.CelPobytu || "Brak danych"],
    ["Podstawa legalnego pobytu:", client.PodLegPob || "Brak danych"],
    ["Data złożenia wniosku:", formatDate(client.DataZloWnio)],
    ["Data odbioru karty pobytu:", formatDate(client.DataOdbKartyPob)],
    ["Data odbioru decyzji:", formatDate(client.DataOdbDecyzji)],
    ["Data zakończenia legalnego pobytu:", formatDate(client.DataZakLegPob)],
    ["Inspektor:", client.Inspektor || "Brak danych"],
    ["Status płatności:", client.StatusPla || "Brak danych"],
  ]

  autoTable(doc, {
    startY: finalY + 5,
    head: [],
    body: caseDetails,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" } },
  })

  // Sekcja dokumentów
  const finalY2 = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.text("Dokumenty", 14, finalY2)

  doc.setFontSize(12)
  const documents = [
    ["Formularz wniosku:", client.FormWni ? "Tak" : "Nie"],
    ["Załącznik nr jedności:", client.ZalNrJed ? "Tak" : "Nie"],
    ["Kopia paszportu:", client.KopiaPasz ? "Tak" : "Nie"],
    ["Załącznik Blue:", client.ZalBlue ? "Tak" : "Nie"],
    ["Cztery zdjęcia:", client.CzteZdjecia ? "Tak" : "Nie"],
    ["Pełnomocnictwo:", client.Pelnomocnictwo ? "Tak" : "Nie"],
  ]

  autoTable(doc, {
    startY: finalY2 + 5,
    head: [],
    body: documents,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" } },
  })

  // Notatki
  if (client.Notes) {
    const finalY3 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text("Notatki", 14, finalY3)

    doc.setFontSize(11)
    const splitNotes = doc.splitTextToSize(client.Notes, 180)
    doc.text(splitNotes, 14, finalY3 + 10)
  }

  // Stopka
  addFooter(doc, 1, 1)

  return doc
}

// Generowanie wniosku o pobyt czasowy
export const generateTemporaryResidenceApplication = (client: Client): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Wniosek o pobyt czasowy")

  // Miejsce i data
  doc.setFontSize(11)
  doc.text("Miejscowość, data:", 130, 50)
  doc.text("......................................", 130, 58)

  // Dane wnioskodawcy
  doc.setFontSize(12)
  doc.text("DANE WNIOSKODAWCY:", 14, 70)

  doc.setFontSize(11)
  doc.text(`Imię i nazwisko: ${client.Name || "......................................"}`, 14, 80)
  doc.text(`Data urodzenia: ${formatDate(client.Birthday) || "......................................"}`, 14, 88)
  doc.text(`Obywatelstwo: ${client.KrajPoch || "......................................"}`, 14, 96)
  doc.text(`Adres zamieszkania: ${client.Adres || "......................................"}`, 14, 104)
  doc.text(`Nr telefonu: ${client.Phone || "......................................"}`, 14, 112)

  // Adresat
  doc.setFontSize(12)
  doc.text("Wojewoda Mazowiecki", 130, 80)
  doc.text("Wydział Spraw Cudzoziemców", 130, 88)
  doc.text("ul. Marszałkowska 3/5", 130, 96)
  doc.text("00-624 Warszawa", 130, 104)

  // Tytuł wniosku
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const title = "WNIOSEK O UDZIELENIE ZEZWOLENIA NA POBYT CZASOWY"
  const titleWidth = (doc.getStringUnitWidth(title) * doc.getFontSize()) / doc.internal.scaleFactor
  const titleX = (doc.internal.pageSize.width - titleWidth) / 2
  doc.text(title, titleX, 130)
  doc.setFont("helvetica", "normal")

  // Treść wniosku
  doc.setFontSize(11)
  const content = `Na podstawie art. 98 ust. 1 ustawy z dnia 12 grudnia 2013 r. o cudzoziemcach (Dz. U. z 2020 r. poz. 35 z późn. zm.) zwracam się z wnioskiem o udzielenie zezwolenia na pobyt czasowy na terytorium Rzeczypospolitej Polskiej.`
  const splitContent = doc.splitTextToSize(content, 180)
  doc.text(splitContent, 14, 145)

  // Cel pobytu
  doc.setFontSize(12)
  doc.text("Cel pobytu:", 14, 165)
  doc.setFontSize(11)
  doc.text(`${client.CelPobytu || "......................................"}`, 50, 165)

  // Uzasadnienie
  doc.setFontSize(12)
  doc.text("UZASADNIENIE", 14, 180)
  doc.setFontSize(11)
  doc.text(
    "......................................................................................................",
    14,
    190,
  )
  doc.text(
    "......................................................................................................",
    14,
    198,
  )
  doc.text(
    "......................................................................................................",
    14,
    206,
  )
  doc.text(
    "......................................................................................................",
    14,
    214,
  )
  doc.text(
    "......................................................................................................",
    14,
    222,
  )

  // Podpis
  doc.text("Z poważaniem,", 130, 240)
  doc.text("......................................", 130, 260)
  doc.text("(podpis wnioskodawcy)", 130, 268)

  // Załączniki
  doc.setFontSize(12)
  doc.text("Załączniki:", 14, 240)
  doc.setFontSize(11)
  let yPos = 250
  const attachments = [
    client.FormWni ? "1. Wypełniony formularz wniosku" : null,
    client.KopiaPasz ? "2. Kopia paszportu" : null,
    client.CzteZdjecia ? "3. Cztery aktualne fotografie" : null,
    client.ZalNrJed ? "4. Potwierdzenie zameldowania" : null,
    client.Pelnomocnictwo ? "5. Pełnomocnictwo" : null,
  ].filter(Boolean)

  attachments.forEach((attachment, index) => {
    if (attachment) {
      doc.text(attachment, 14, yPos)
      yPos += 8
    }
  })

  // Stopka
  addFooter(doc, 1, 1)

  return doc
}

// Generowanie pełnomocnictwa
export const generatePowerOfAttorney = (client: Client): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Pełnomocnictwo")

  // Miejsce i data
  doc.setFontSize(11)
  doc.text("Miejscowość, data:", 130, 50)
  doc.text("......................................", 130, 58)

  // Tytuł
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  const title = "PEŁNOMOCNICTWO"
  const titleWidth = (doc.getStringUnitWidth(title) * doc.getFontSize()) / doc.internal.scaleFactor
  const titleX = (doc.internal.pageSize.width - titleWidth) / 2
  doc.text(title, titleX, 80)
  doc.setFont("helvetica", "normal")

  // Dane mocodawcy
  doc.setFontSize(12)
  doc.text("Ja, niżej podpisany/a:", 14, 100)
  doc.setFontSize(11)
  doc.text(`Imię i nazwisko: ${client.Name || "......................................"}`, 14, 110)
  doc.text(`Data urodzenia: ${formatDate(client.Birthday) || "......................................"}`, 14, 118)
  doc.text(`Obywatelstwo: ${client.KrajPoch || "......................................"}`, 14, 126)
  doc.text(`Nr paszportu: ......................................`, 14, 134)
  doc.text(`Adres zamieszkania: ${client.Adres || "......................................"}`, 14, 142)

  // Treść pełnomocnictwa
  doc.setFontSize(12)
  doc.text("udzielam pełnomocnictwa:", 14, 160)
  doc.setFontSize(11)
  doc.text("Pani/Panu: ......................................", 14, 170)
  doc.text("PESEL: ......................................", 14, 178)
  doc.text("Nr dowodu osobistego: ......................................", 14, 186)
  doc.text("Adres zamieszkania: ......................................", 14, 194)

  // Zakres pełnomocnictwa
  doc.setFontSize(12)
  doc.text("do reprezentowania mnie przed:", 14, 212)
  doc.setFontSize(11)
  doc.text("1. Wojewodą Mazowieckim", 14, 222)
  doc.text("2. Urzędem do Spraw Cudzoziemców", 14, 230)
  doc.text("3. Innymi organami administracji publicznej", 14, 238)

  doc.setFontSize(11)
  const content = `w sprawie uzyskania zezwolenia na pobyt czasowy/stały* na terytorium Rzeczypospolitej Polskiej, w tym do składania w moim imieniu wszelkich oświadczeń, wniosków, odbioru decyzji oraz wykonywania wszelkich czynności faktycznych i prawnych związanych z prowadzonym postępowaniem.`
  const splitContent = doc.splitTextToSize(content, 180)
  doc.text(splitContent, 14, 250)

  // Podpisy
  doc.text("......................................", 40, 280)
  doc.text("(podpis mocodawcy)", 40, 288)

  doc.text("......................................", 140, 280)
  doc.text("(podpis pełnomocnika)", 140, 288)

  // Stopka
  addFooter(doc, 1, 1)

  return doc
}

// Generowanie zaświadczenia o zameldowaniu
export const generateRegistrationCertificate = (client: Client): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Zaświadczenie o zameldowaniu")

  // Numer zaświadczenia
  doc.setFontSize(12)
  doc.text(`Nr zaświadczenia: ${client.NumerSprawy || "SO.5343.XXX.YYYY"}`, 14, 50)

  // Miejsce i data
  doc.text("Warszawa, dnia ......................................", 120, 50)

  // Tytuł
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  const title = "ZAŚWIADCZENIE O ZAMELDOWANIU"
  const titleWidth = (doc.getStringUnitWidth(title) * doc.getFontSize()) / doc.internal.scaleFactor
  const titleX = (doc.internal.pageSize.width - titleWidth) / 2
  doc.text(title, titleX, 70)
  doc.setFont("helvetica", "normal")

  // Treść zaświadczenia
  doc.setFontSize(12)
  const content = `Zaświadcza się, że:`
  doc.text(content, 14, 90)

  // Dane osoby
  doc.setFontSize(12)
  doc.text(`Pan/Pani: ${client.Name || "......................................"}`, 14, 105)
  doc.text(`Data urodzenia: ${formatDate(client.Birthday) || "......................................"}`, 14, 115)
  doc.text(`Obywatelstwo: ${client.KrajPoch || "......................................"}`, 14, 125)

  // Informacje o zameldowaniu
  doc.setFontSize(12)
  doc.text("jest zameldowany/a na pobyt:", 14, 145)
  doc.text("□ stały", 20, 155)
  doc.text("□ czasowy do dnia ......................................", 20, 165)

  doc.text("pod adresem:", 14, 180)
  doc.text(`${client.Adres || "......................................"}`, 20, 190)

  // Informacja o opłacie
  doc.setFontSize(10)
  doc.text("Zaświadczenie wydaje się na wniosek zainteresowanego.", 14, 210)
  doc.text("Opłata skarbowa za wydanie zaświadczenia: 17 zł", 14, 220)

  // Podpis
  doc.setFontSize(11)
  doc.text("......................................", 140, 240)
  doc.text("(podpis i pieczęć)", 140, 248)

  // Stopka
  addFooter(doc, 1, 1)

  return doc
}

// Generowanie listy klientów
export const generateClientsList = (clients: Client[]): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Lista klientów")

  // Przygotowanie danych do tabeli
  const tableColumn = ["Imię i nazwisko", "Status", "Kraj pochodzenia", "Cel pobytu", "Data złożenia", "Numer sprawy"]
  const tableRows = clients.map((client) => [
    client.Name || "",
    client.Status || "",
    client.KrajPoch || "",
    client.CelPobytu || "",
    formatDate(client.DataZloWnio),
    client.NumerSprawy || "",
  ])

  // Generowanie tabeli
  autoTable(doc, {
    startY: 45,
    head: [tableColumn],
    body: tableRows,
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 45, bottom: 15 },
    didDrawPage: (data) => {
      // Dodaj stopkę na każdej stronie
      addFooter(doc, doc.getCurrentPageInfo().pageNumber, doc.getNumberOfPages())
    },
  })

  return doc
}

// Generowanie raportu statystycznego
export const generateStatisticsReport = (clients: Client[]): jsPDF => {
  const doc = new jsPDF()

  // Nagłówek dokumentu
  addDocumentHeader(doc, "Raport statystyczny")

  // Obliczanie statystyk
  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.Status?.toLowerCase() === "aktywny").length
  const inactiveClients = clients.filter((c) => c.Status?.toLowerCase() === "nieaktywny").length
  const inProgressClients = clients.filter((c) => c.Status?.toLowerCase() === "w trakcie").length

  // Statystyki według krajów
  const countriesMap = new Map<string, number>()
  clients.forEach((client) => {
    if (client.KrajPoch) {
      const count = countriesMap.get(client.KrajPoch) || 0
      countriesMap.set(client.KrajPoch, count + 1)
    }
  })

  const countriesData = Array.from(countriesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => [country, count.toString()])

  // Statystyki według celów pobytu
  const purposesMap = new Map<string, number>()
  clients.forEach((client) => {
    if (client.CelPobytu) {
      const count = purposesMap.get(client.CelPobytu) || 0
      purposesMap.set(client.CelPobytu, count + 1)
    }
  })

  const purposesData = Array.from(purposesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([purpose, count]) => [purpose, count.toString()])

  // Wyświetlanie statystyk
  doc.setFontSize(14)
  doc.text("Podsumowanie", 14, 50)

  doc.setFontSize(12)
  doc.text(`Łączna liczba klientów: ${totalClients}`, 14, 60)
  doc.text(`Klienci aktywni: ${activeClients} (${Math.round((activeClients / totalClients) * 100)}%)`, 14, 68)
  doc.text(`Klienci nieaktywni: ${inactiveClients} (${Math.round((inactiveClients / totalClients) * 100)}%)`, 14, 76)
  doc.text(`Sprawy w trakcie: ${inProgressClients} (${Math.round((inProgressClients / totalClients) * 100)}%)`, 14, 84)

  // Tabela krajów pochodzenia
  doc.setFontSize(14)
  doc.text("Kraje pochodzenia klientów", 14, 100)

  autoTable(doc, {
    startY: 105,
    head: [["Kraj pochodzenia", "Liczba klientów"]],
    body: countriesData,
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
    tableWidth: 90,
  })

  // Tabela celów pobytu
  doc.setFontSize(14)
  doc.text("Cele pobytu", 120, 100)

  autoTable(doc, {
    startY: 105,
    head: [["Cel pobytu", "Liczba klientów"]],
    body: purposesData,
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 120, right: 14 },
    tableWidth: 90,
  })

  // Statystyki miesięczne
  const monthlyStats = new Map<string, number>()
  clients.forEach((client) => {
    if (client.DataZloWnio) {
      try {
        const date = new Date(client.DataZloWnio)
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
          const count = monthlyStats.get(monthYear) || 0
          monthlyStats.set(monthYear, count + 1)
        }
      } catch (error) {
        // Ignoruj błędne daty
      }
    }
  })

  const monthlyData = Array.from(monthlyStats.entries())
    .sort((a, b) => {
      const [aMonth, aYear] = a[0].split("/").map(Number)
      const [bMonth, bYear] = b[0].split("/").map(Number)
      return bYear * 12 + bMonth - (aYear * 12 + aMonth)
    })
    .slice(0, 12)
    .reverse()
    .map(([monthYear, count]) => {
      const [month, year] = monthYear.split("/")
      const date = new Date(Number(year), Number(month) - 1, 1)
      const monthName = date.toLocaleDateString("pl-PL", { month: "long" })
      return [`${monthName} ${year}`, count.toString()]
    })

  // Tabela statystyk miesięcznych
  const finalY = Math.max((doc as any).lastAutoTable.finalY || 0, (doc as any).lastAutoTable.finalY || 0) + 20

  doc.setFontSize(14)
  doc.text("Liczba nowych klientów w ostatnich miesiącach", 14, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [["Miesiąc", "Liczba nowych klientów"]],
    body: monthlyData,
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  // Stopka
  addFooter(doc, 1, doc.getNumberOfPages())

  return doc
}

// Eksport wszystkich funkcji generowania dokumentów
export const documentGenerators = {
  clientCard: generateClientCard,
  temporaryResidenceApplication: generateTemporaryResidenceApplication,
  powerOfAttorney: generatePowerOfAttorney,
  registrationCertificate: generateRegistrationCertificate,
  clientsList: generateClientsList,
  statisticsReport: generateStatisticsReport,
}

// Typy dokumentów
export type DocumentType = keyof typeof documentGenerators

// Nazwy dokumentów po polsku
export const documentNames: Record<DocumentType, string> = {
  clientCard: "Karta klienta",
  temporaryResidenceApplication: "Wniosek o pobyt czasowy",
  powerOfAttorney: "Pełnomocnictwo",
  registrationCertificate: "Zaświadczenie o zameldowaniu",
  clientsList: "Lista klientów",
  statisticsReport: "Raport statystyczny",
}

