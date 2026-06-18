"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { resetPassword, signInWithGoogle } from "@/lib/superbase"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// Logo Google (brand) – lucide nie udostępnia ikon marek, więc używamy inline SVG.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState<"login" | "reset">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Stan trybu przypomnienia hasła
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetEmail) {
      return
    }

    setResetLoading(true)

    try {
      const { error } = await resetPassword(
        resetEmail,
        `${window.location.origin}/update-password`,
      )

      if (error) {
        toast({
          title: "Błąd",
          description: error.message || "Nie udało się wysłać linku. Spróbuj ponownie.",
          variant: "destructive",
        })
        return
      }

      setResetSent(true)
      toast({
        title: "Sprawdź swoją skrzynkę",
        description: "Jeśli konto istnieje, wysłaliśmy link do zresetowania hasła.",
      })
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle(`${window.location.origin}/login`)

      if (error) {
        toast({
          title: "Błąd logowania",
          description: error.message || "Nie udało się zalogować przez Google.",
          variant: "destructive",
        })
        setGoogleLoading(false)
      }
      // W przypadku sukcesu następuje przekierowanie do Google,
      // więc nie resetujemy stanu ładowania.
    } catch (error) {
      toast({
        title: "Błąd logowania",
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
        variant: "destructive",
      })
      setGoogleLoading(false)
    }
  }

  const backToLogin = () => {
    setMode("login")
    setResetSent(false)
    setResetEmail("")
  }

  if (mode === "reset") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Card className="mx-auto max-w-md w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Przypomnienie hasła</CardTitle>
            <CardDescription>
              {resetSent
                ? "Jeśli konto o podanym adresie istnieje, wysłaliśmy na nie link do zresetowania hasła."
                : "Podaj swój adres email, a wyślemy Ci link do ustawienia nowego hasła."}
            </CardDescription>
          </CardHeader>
          {resetSent ? (
            <CardFooter>
              <Button type="button" variant="outline" className="w-full" onClick={backToLogin}>
                Wróć do logowania
              </Button>
            </CardFooter>
          ) : (
            <form onSubmit={handleReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    "Wyślij link"
                  )}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={backToLogin}>
                  Wróć do logowania
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Panel logowania</CardTitle>
          <CardDescription>
            Wprowadź swoje dane logowania, aby uzyskać dostęp do panelu CRM
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <Button
                  variant="link"
                  className="text-xs p-0 h-auto"
                  size="sm"
                  type="button"
                  onClick={() => setMode("reset")}
                >
                  Zapomniałeś hasła?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || googleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">lub</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Zaloguj się przez Google
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}