"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Camera, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { uploadUserAvatar, deleteUserAvatar } from "@/lib/superbase"
import { useAuth } from "@/hooks/use-auth"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onAvatarChange?: (newAvatarUrl: string | null) => void
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarChange,
  size = "md" 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Rozmiary avatara
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  }

  // Funkcja do pobrania inicjałów
  const getInitials = (email: string) => {
    if (!email) return "U"
    const parts = email.split("@")[0].split(".")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  // Obsługa wyboru pliku
  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Walidacja pliku
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Błąd",
        description: "Można wgrać tylko pliki obrazów (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Błąd", 
        description: "Plik jest za duży. Maksymalny rozmiar to 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Podgląd lokalny
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // Upload do Supabase
      const avatarUrl = await uploadUserAvatar(file)
      
      if (avatarUrl) {
        setPreviewUrl(avatarUrl)
        onAvatarChange?.(avatarUrl)
        toast({
          title: "Sukces",
          description: "Zdjęcie profilowe zostało zaktualizowane!",
        })
      } else {
        throw new Error("Nie udało się wgrać zdjęcia")
      }
    } catch (error) {
      console.error("Błąd podczas wgrywania:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się wgrać zdjęcia. Spróbuj ponownie.",
        variant: "destructive",
      })
      setPreviewUrl(currentAvatarUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  // Obsługa usuwania avatara
  const handleDeleteAvatar = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    try {
      const success = await deleteUserAvatar()
      if (success) {
        setPreviewUrl(null)
        onAvatarChange?.(null)
        toast({
          title: "Sukces",
          description: "Zdjęcie profilowe zostało usunięte.",
        })
      } else {
        throw new Error("Nie udało się usunąć zdjęcia")
      }
    } catch (error) {
      console.error("Błąd podczas usuwania:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zdjęcia.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={previewUrl || undefined} alt="Profile" />
          <AvatarFallback>
            {user ? getInitials(user.email) : "U"}
          </AvatarFallback>
        </Avatar>
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Kliknij aby wybrać</span> lub przeciągnij zdjęcie
          </div>
          <div className="text-xs text-muted-foreground">
            PNG, JPG do 5MB
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {previewUrl ? "Zmień" : "Wgraj"}
        </Button>
        
        {previewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isUploading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
        )}
      </div>
    </div>
  )
} 