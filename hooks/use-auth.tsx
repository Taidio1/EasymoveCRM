"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, getCurrentUser, signIn, signOut, getUserProfile, UserProfile } from "@/lib/superbase"
import { toast } from "./use-toast"

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Sprawdzenie czy użytkownik jest zalogowany oraz nasłuchiwanie zmian sesji.
  // onAuthStateChange emituje INITIAL_SESSION przy starcie (obsługa pierwszego
  // renderowania) oraz SIGNED_IN po powrocie z logowania przez Google.
  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        // Pobieramy profil użytkownika zamiast podstawowych danych
        const userProfile = await getUserProfile()
        if (active) setUser(userProfile)
      } catch (error) {
        console.error("Błąd podczas pobierania użytkownika:", error)
      } finally {
        if (active) setLoading(false)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (session) {
        // Odraczamy wywołanie async, aby uniknąć blokady w callbacku Supabase
        setTimeout(() => {
          if (active) loadProfile()
        }, 0)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])
  
  // Przekierowania zależne od roli (klient ↔ CRM)
  useEffect(() => {
    if (loading) return
    const publicPaths = ["/login", "/update-password"]
    const isPublic = publicPaths.includes(pathname)
    const isPanel = pathname === "/panel" || pathname.startsWith("/panel/")
    const isClient = user?.role === "Client"

    if (!user) {
      if (!isPublic) router.push("/login")
      return
    }
    if (pathname === "/login") {
      router.push(isClient ? "/panel" : "/")
      return
    }
    // Klient nie wchodzi do CRM; staff nie wchodzi do panelu.
    if (isClient && !isPanel && !isPublic) router.push("/panel")
    if (!isClient && isPanel) router.push("/")
  }, [user, loading, pathname, router])
  
  // Funkcja logowania - zaktualizowana
  const login = async (email: string, password: string) => {
    try {
      console.log("Próba logowania dla:", email);
      
      const { error } = await signIn({ email, password })
      
      if (error) {
        console.error("Błąd logowania Supabase:", error);
        toast({
          title: "Błąd logowania",
          description: error.message || "Nieprawidłowy email lub hasło",
          variant: "destructive",
        })
        return false
      }
      
      console.log("Logowanie przez Supabase Auth zakończone sukcesem");
      
      // Pobieramy pełny profil użytkownika po zalogowaniu
      const userProfile = await getUserProfile()
      
      if (!userProfile) {
        console.error("Nie można pobrać profilu użytkownika po zalogowaniu");
        toast({
          title: "Błąd logowania",
          description: "Nie można pobrać danych użytkownika. Spróbuj ponownie.",
          variant: "destructive",
        })
        return false
      }
      
      console.log("Profil użytkownika pobrany:", userProfile);
      setUser(userProfile)
      
      toast({
        title: "Zalogowano pomyślnie",
        description: `Witaj, ${userProfile?.first_name || userProfile?.email}!`,
      })
      
      return true
    } catch (error) {
      console.error("Błąd podczas logowania:", error)
      toast({
        title: "Błąd logowania",
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas logowania.",
        variant: "destructive",
      })
      return false
    }
  }
  
  // Funkcja wylogowania
  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      router.push("/login")
      
      toast({
        title: "Wylogowano pomyślnie",
      })
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error)
      toast({
        title: "Błąd wylogowania",
        description: "Wystąpił błąd podczas wylogowywania.",
        variant: "destructive",
      })
    }
  }

  // Funkcja odświeżania danych użytkownika
  const refreshUser = async () => {
    try {
      const userProfile = await getUserProfile()
      setUser(userProfile)
    } catch (error) {
      console.error("Błąd podczas odświeżania profilu użytkownika:", error)
    }
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  return context
} 