"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, updatePassword } from "@/lib/superbase"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Po wejściu z linku w mailu Supabase ustawia sesję recovery z adresu URL.
  // Czekamy aż sesja będzie dostępna, zanim pozwolimy ustawić nowe hasło.
  useEffect(() => {
    let active = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (active) {
        setHasSession(!!data.session)
        setCheckingSession(false)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setHasSession(!!session)
        setCheckingSession(false)
      }
    })

    checkSession()

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      return
    }

    if (password.length < 6) {
      toast({
        title: "Hasło jest za krótkie",
        description: "Hasło musi mieć co najmniej 6 znaków.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Hasła się różnią",
        description: "Wpisane hasła nie są identyczne.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updatePassword(password)

      if (error) {
        toast({
          title: "Błąd",
          description: error.message || "Nie udało się zmienić hasła. Spróbuj ponownie.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Hasło zostało zmienione",
        description: "Możesz teraz korzystać z panelu.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
          <CardDescription>
            Wprowadź nowe hasło do swojego konta.
          </CardDescription>
        </CardHeader>

        {checkingSession ? (
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        ) : !hasSession ? (
          <>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Link do resetu hasła jest nieprawidłowy lub wygasł. Poproś o nowy link na stronie logowania.
              </p>
            </CardContent>
            <CardFooter>
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/login")}>
                Wróć do logowania
              </Button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nowe hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Powtórz hasło</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz nowe hasło"
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}