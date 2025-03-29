"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, signIn, signOut, getUserProfile, UserProfile } from "@/lib/superbase"
import { toast } from "./use-toast"

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Sprawdzenie czy użytkownik jest zalogowany przy pierwszym renderowaniu
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Pobieramy profil użytkownika zamiast podstawowych danych
        const userProfile = await getUserProfile()
        setUser(userProfile)
      } catch (error) {
        console.error("Błąd podczas pobierania użytkownika:", error)
      } finally {
        setLoading(false)
      }
    }
    
    checkUser()
  }, [])
  
  // Przekierowanie niezalogowanych użytkowników do strony logowania
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/")
      }
    }
  }, [user, loading, pathname, router])
  
  // Funkcja logowania - zaktualizowana
  const login = async (email: string, password: string) => {
    try {
      const { error } = await signIn({ email, password })
      
      if (error) {
        toast({
          title: "Błąd logowania",
          description: error.message,
          variant: "destructive",
        })
        return false
      }
      
      // Pobieramy pełny profil użytkownika po zalogowaniu
      const userProfile = await getUserProfile()
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
        description: "Wystąpił nieoczekiwany błąd podczas logowania.",
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
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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