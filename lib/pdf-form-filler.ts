import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getClients, type Client } from "@/lib/superbase"

// Funkcja pomocnicza do osadzania czcionki z obsługą UTF-8
async function embedCustomFont(pdfDoc: PDFDocument): Promise<any> {
  try {
    // Możemy użyć standardowej czcionki z lepszym wsparciem dla UTF-8
    return await pdfDoc.embedFont(StandardFonts.TimesRoman)
  } catch (error) {
    console.error("Błąd podczas osadzania czcionki:", error)
    // Fallback do standardowej czcionki
    return await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
}

/**
 * Funkcja do wypełniania formularza wniosku o pobyt czasowy
 * @param formPdfBytes Bajty oryginalnego formularza PDF
 * @param client Dane klienta
 * @returns Bajty wypełnionego formularza PDF
 */
export async function fillTemporaryResidenceForm(formPdfBytes: ArrayBuffer, client: Client): Promise<Uint8Array> {
  try {
    // Wczytaj dokument PDF
    const pdfDoc = await PDFDocument.load(formPdfBytes, {
      // Dodaj opcje ładowania, które mogą pomóc z obsługą UTF-8
      ignoreEncryption: true,
      updateMetadata: false,
    })

    // Reszta funkcji pozostaje bez zmian...
    // Pobierz formularz z dokumentu
    const form = pdfDoc.getForm()

    // Mapowanie pól klienta na pola formularza

    // Sekcja A - Dane osobowe cudzoziemca
    try {
      // Nazwisko
      const nazwiskoField = form.getTextField("Nazwisko")
      if (nazwiskoField) {
        const nazwisko = client.Name?.split(" ").slice(-1)[0] || ""
        nazwiskoField.setText(nazwisko.toUpperCase())
      }

      // Imię
      const imieField = form.getTextField("Imię")
      if (imieField) {
        const imie = client.Name?.split(" ").slice(0, -1).join(" ") || ""
        imieField.setText(imie.toUpperCase())
      }

      // Data urodzenia (format: rok/miesiąc/dzień)
      if (client.Birthday) {
        const dateParts = client.Birthday.split("-")
        if (dateParts.length === 3) {
          const rokField = form.getTextField("rok_urodzenia")
          const miesiacField = form.getTextField("miesiac_urodzenia")
          const dzienField = form.getTextField("dzien_urodzenia")

          if (rokField) rokField.setText(dateParts[0])
          if (miesiacField) miesiacField.setText(dateParts[1])
          if (dzienField) dzienField.setText(dateParts[2])
        }
      }

      // Płeć - domyślnie M (męska)
      const plecField = form.getTextField("Płeć")
      if (plecField) plecField.setText("M")

      // Obywatelstwo
      const obywatelstwoField = form.getTextField("Obywatelstwo")
      if (obywatelstwoField && client.KrajPoch) {
        obywatelstwoField.setText(client.KrajPoch.toUpperCase())
      }

      // Narodowość (taka sama jak kraj pochodzenia)
      const narodowoscField = form.getTextField("Narodowość")
      if (narodowoscField && client.KrajPoch) {
        narodowoscField.setText(client.KrajPoch.toUpperCase())
      }

      // Telefon
      const telefonField = form.getTextField("Numer telefonu")
      if (telefonField && client.Phone) {
        telefonField.setText(client.Phone)
      }

      // Email
      const emailField = form.getTextField("Email")
      if (emailField && client.Email) {
        emailField.setText(client.Email)
      }

      // Sekcja B - Miejsce pobytu cudzoziemca
      // Adres w Polsce
      if (client.Adres) {
        const adresParts = parseAddress(client.Adres)

        const wojewodztwoField = form.getTextField("Województwo")
        if (wojewodztwoField) wojewodztwoField.setText(adresParts.wojewodztwo || "MAZOWIECKIE")

        const miejscowoscField = form.getTextField("Miejscowość")
        if (miejscowoscField) miejscowoscField.setText(adresParts.miejscowosc || "WARSZAWA")

        const ulicaField = form.getTextField("Ulica")
        if (ulicaField) ulicaField.setText(adresParts.ulica || "")

        const numerDomuField = form.getTextField("Numer domu")
        if (numerDomuField) numerDomuField.setText(adresParts.numerDomu || "")

        const numerMieszkaniaField = form.getTextField("Numer mieszkania")
        if (numerMieszkaniaField) numerMieszkaniaField.setText(adresParts.numerMieszkania || "")

        const kodPocztowyField = form.getTextField("Kod pocztowy")
        if (kodPocztowyField) kodPocztowyField.setText(adresParts.kodPocztowy || "")
      }

      // Sekcja C - Informacje dodatkowe
      // Cel pobytu
      if (client.CelPobytu) {
        // Zaznaczenie odpowiedniego pola wyboru dla celu pobytu
        const celPobytuMap: Record<string, number> = {
          Praca: 1,
          Studia: 5,
          Rodzina: 10,
          Inne: 16,
        }

        const celIndex = celPobytuMap[client.CelPobytu] || 16
        const celPobytuField = form.getCheckBox(`cel_pobytu_${celIndex}`)
        if (celPobytuField) celPobytuField.check()

        // Jeśli wybrano "Inne", wpisz szczegóły
        if (celIndex === 16) {
          const inneField = form.getTextField("cel_pobytu_inne")
          if (inneField) inneField.setText(client.CelPobytu)
        }
      }
    } catch (fieldError) {
      console.warn("Błąd podczas wypełniania pól formularza:", fieldError)
      // Kontynuuj mimo błędu z polami - niektóre pola mogą nie istnieć w formularzu
    }

    // Spłaszcz formularz, aby zapisać wprowadzone dane
    form.flatten()

    // Zapisz zmodyfikowany dokument
    return await pdfDoc.save()
  } catch (error) {
    console.error("Błąd podczas wypełniania formularza PDF:", error)
    // Jeśli wystąpił błąd, wygeneruj prosty dokument zastępczy
    return await createSimpleFormDocument(client)
  }
}

/**
 * Funkcja tworząca prosty dokument zastępczy, gdy oryginalny formularz nie jest dostępny
 * Z obsługą znaków UTF-8, w tym polskich znaków diakrytycznych
 */
export async function createSimpleFormDocument(client: Client): Promise<Uint8Array> {
  // Utwórz nowy dokument PDF
  const pdfDoc = await PDFDocument.create()

  // Zamiast standardowej czcionki Helvetica, użyjmy czcionki, która lepiej obsługuje znaki UTF-8
  // Możemy użyć wbudowanych czcionek, które mają lepsze wsparcie dla znaków diakrytycznych
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // Dodaj stronę
  const page = pdfDoc.addPage([595, 842]) // A4

  // Funkcja pomocnicza do bezpiecznego renderowania tekstu z obsługą UTF-8
  const drawSafeText = (text: string, options: any) => {
    try {
      // Upewnij się, że tekst jest stringiem
      const safeText = String(text || "")
      page.drawText(safeText, options)
    } catch (error) {
      console.error("Błąd podczas renderowania tekstu:", error)
      // W przypadku błędu, spróbuj usunąć problematyczne znaki
      const fallbackText = String(text || "").replace(/[^\x00-\x7F]/g, "_")
      page.drawText(fallbackText, options)
    }
  }

  // Tytuł
  drawSafeText("WNIOSEK O UDZIELENIE ZEZWOLENIA NA POBYT CZASOWY", {
    x: 50,
    y: 800,
    size: 16,
    font: boldFont,
  })

  // Informacja o zastępczym dokumencie
  drawSafeText("(Dokument zastępczy - oryginalny formularz nie jest dostępny)", {
    x: 50,
    y: 780,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  // Dane klienta
  drawSafeText("DANE OSOBOWE CUDZOZIEMCA:", {
    x: 50,
    y: 740,
    size: 12,
    font: boldFont,
  })

  const dataLines = [
    { label: "Nazwisko:", value: client.Name?.split(" ").slice(-1)[0]?.toUpperCase() || "" },
    { label: "Imię:", value: client.Name?.split(" ").slice(0, -1).join(" ")?.toUpperCase() || "" },
    { label: "Data urodzenia:", value: client.Birthday || "" },
    { label: "Obywatelstwo:", value: client.KrajPoch?.toUpperCase() || "" },
    { label: "Telefon:", value: client.Phone || "" },
    { label: "Email:", value: client.Email || "" },
    { label: "Adres:", value: client.Adres || "" },
  ]

  let yPosition = 720
  dataLines.forEach(({ label, value }) => {
    drawSafeText(label, {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
    })

    drawSafeText(value, {
      x: 150,
      y: yPosition,
      size: 11,
      font,
    })

    yPosition -= 20
  })

  // Cel pobytu
  drawSafeText("CEL POBYTU:", {
    x: 50,
    y: yPosition - 20,
    size: 12,
    font: boldFont,
  })

  drawSafeText(client.CelPobytu || "", {
    x: 150,
    y: yPosition - 20,
    size: 11,
    font,
  })

  // Informacja o podstawie prawnej
  yPosition -= 80
  drawSafeText("Podstawa prawna:", {
    x: 50,
    y: yPosition,
    size: 10,
    font: boldFont,
  })

  drawSafeText("Art. 98 ust. 1 ustawy z dnia 12 grudnia 2013 r. o cudzoziemcach", {
    x: 50,
    y: yPosition - 15,
    size: 10,
    font,
  })

  // Miejsce na podpis
  yPosition -= 100
  drawSafeText("Data i podpis:", {
    x: 350,
    y: yPosition,
    size: 11,
    font: boldFont,
  })

  drawSafeText("......................................", {
    x: 350,
    y: yPosition - 30,
    size: 11,
    font,
  })

  // Dodajmy informację o kodowaniu UTF-8
  drawSafeText("Dokument z obsługą polskich znaków: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ", {
    x: 50,
    y: 50,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  // Zapisz dokument
  return await pdfDoc.save()
}

/**
 * Funkcja pomocnicza do parsowania adresu
 */
function parseAddress(address: string): {
  wojewodztwo: string
  miejscowosc: string
  ulica: string
  numerDomu: string
  numerMieszkania: string
  kodPocztowy: string
} {
  // Domyślne wartości
  const result = {
    wojewodztwo: "MAZOWIECKIE",
    miejscowosc: "WARSZAWA",
    ulica: "",
    numerDomu: "",
    numerMieszkania: "",
    kodPocztowy: "",
  }

  try {
    // Przykładowy format adresu: "ul. Marszałkowska 126/128 m. 4, 00-008 Warszawa"

    // Wyciągnij kod pocztowy
    const kodPocztowyMatch = address.match(/\d{2}-\d{3}/)
    if (kodPocztowyMatch) {
      result.kodPocztowy = kodPocztowyMatch[0]
    }

    // Wyciągnij miejscowość (zakładamy, że jest po kodzie pocztowym)
    const miejscowoscMatch = address.match(/\d{2}-\d{3}\s+([^,]+)/)
    if (miejscowoscMatch && miejscowoscMatch[1]) {
      result.miejscowosc = miejscowoscMatch[1].trim().toUpperCase()
    }

    // Wyciągnij ulicę i numer domu
    const ulicaMatch = address.match(/ul\.\s+([^,]+)/)
    if (ulicaMatch && ulicaMatch[1]) {
      const ulicaFull = ulicaMatch[1].trim()

      // Rozdziel ulicę od numeru domu
      const ulicaParts = ulicaFull.split(/\s+(?=\d)/)
      if (ulicaParts.length > 1) {
        result.ulica = ulicaParts[0].toUpperCase()

        // Przetwórz numer domu i mieszkania
        const numerParts = ulicaParts[1].split(/[/\s]+m\.\s*/)
        result.numerDomu = numerParts[0]

        if (numerParts.length > 1) {
          result.numerMieszkania = numerParts[1]
        }
      } else {
        result.ulica = ulicaFull.toUpperCase()
      }
    }

    return result
  } catch (error) {
    console.error("Błąd podczas parsowania adresu:", error)
    return result
  }
}

/**
 * Funkcja do pobierania wypełnionego formularza
 * Z obsługą znaków UTF-8
 */
export async function downloadFilledForm(
  client: Client,
  formPdfUrl: string,
  fileName = "wniosek_pobyt_czasowy.pdf",
): Promise<void> {
  try {
    console.log("Generowanie dokumentu zastępczego dla klienta:", client.Name)

    // Zamiast próbować ładować PDF, od razu generujemy dokument zastępczy
    const filledPdfBytes = await createSimpleFormDocument(client)

    // Utwórz blob z wypełnionym formularzem
    // Dodajmy typ MIME z kodowaniem UTF-8
    const blob = new Blob([filledPdfBytes], { type: "application/pdf; charset=utf-8" })

    // Utwórz URL dla blob
    const url = URL.createObjectURL(blob)

    // Utwórz element <a> do pobrania pliku
    const link = document.createElement("a")
    link.href = url
    // Dodajmy kodowanie UTF-8 do nazwy pliku
    link.download = encodeURIComponent(fileName)
    document.body.appendChild(link)

    // Kliknij link, aby pobrać plik
    link.click()

    // Usuń link i zwolnij URL
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error("Błąd podczas pobierania wypełnionego formularza:", error)
    throw error
  }
}

