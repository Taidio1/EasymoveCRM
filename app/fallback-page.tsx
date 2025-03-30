'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function FallbackPage({ title = "Ładowanie strony", message = "Proszę czekać, trwa ładowanie danych..." }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRetry = () => {
    setIsLoading(true)
    // Spróbuj odświeżyć stronę
    router.refresh()
    // Po 2 sekundach, jeśli strona się nie załadowała, spróbuj ponownie załadować
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="text-center text-muted-foreground">
                Jeśli strona nie ładuje się prawidłowo, spróbuj odświeżyć.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleRetry} 
            disabled={isLoading}
          >
            {isLoading ? "Ładowanie..." : "Odśwież stronę"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 