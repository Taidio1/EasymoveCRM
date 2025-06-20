"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Upload, CheckCircle, AlertCircle, FileText, X, Globe, ArrowLeft } from "lucide-react"
import { 
  getCountries, 
  addClientFromForm, 
  uploadFormDocument, 
  type Country, 
  type ClientFormData 
} from "@/lib/superbase"
import { useTranslations, type Language } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LoadingSpinner } from "@/components/loading-spinner"

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

export function ClientRegistrationForm() {
  // Stan aplikacji
  const [language, setLanguage] = useState<Language>('pl')
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedClient, setSubmittedClient] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tłumaczenia
  const t = useTranslations(language)

  // Schema walidacji z tłumaczeniami
  const clientFormSchema = z.object({
    Name: z.string()
      .min(2, t.validation.nameMin)
      .max(100, t.validation.nameMax),
    Email: z.string()
      .email(t.validation.emailInvalid)
      .min(1, t.validation.emailRequired),
    Phone: z.string()
      .min(9, t.validation.phoneMin)
      .max(15, t.validation.phoneMax)
      .regex(/^[+]?[0-9\s-()]+$/, t.validation.phoneInvalid),
    CelPobytu: z.string()
      .min(1, t.validation.purposeRequired),
    country_id: z.number()
      .min(1, t.validation.countryRequired)
  })

  type ClientFormValues = z.infer<typeof clientFormSchema>

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      Name: "",
      Email: "",
      Phone: "",
      CelPobytu: "",
      country_id: 0
    }
  })

  // Pobieranie krajów przy załadowaniu
  useEffect(() => {
    async function fetchCountries() {
      const countriesData = await getCountries()
      setCountries(countriesData)
    }
    fetchCountries()
  }, [])

  // Formatowanie rozmiaru pliku
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Obsługa wyboru plików
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      // Walidacja typu pliku
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Nieprawidłowy typ pliku",
          description: `${file.name} ${t.validation.invalidFileType}`,
          variant: "destructive"
        })
        return
      }

      // Walidacja rozmiaru pliku (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Plik za duży",
          description: `${file.name} ${t.validation.fileTooLarge}`,
          variant: "destructive"
        })
        return
      }

      setUploadedFiles(prev => [...prev, {
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      }])
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Usuwanie pliku
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Obsługa wysłania formularza
  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true)
    
    try {
      // 1. Dodaj klienta do bazy danych
      const result = await addClientFromForm(data)
      
      if (!result.success) {
        throw new Error(result.error || 'Błąd podczas dodawania klienta')
      }

      const clientId = result.client.id

      // 2. Wgraj pliki jeśli są
      if (uploadedFiles.length > 0) {
        setIsUploadingFiles(true)
        
        for (const uploadedFile of uploadedFiles) {
          await uploadFormDocument(uploadedFile.file, clientId)
        }
      }

      // 3. Pokaż sukces
      setSubmittedClient(result.client)
      setIsSubmitted(true)
      
      toast({
        title: t.success.title,
        description: `${t.success.description}`
      })

      // 4. Resetuj formularz
      form.reset()
      setUploadedFiles([])

    } catch (error) {
      console.error('Błąd podczas wysyłania formularza:', error)
      toast({
        title: "Błąd wysyłania wniosku",
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsUploadingFiles(false)
    }
  }

  // Reset do nowego formularza
  const handleNewForm = () => {
    setIsSubmitted(false)
    setSubmittedClient(null)
    form.reset()
    setUploadedFiles([])
  }

  // Ekran sukcesu
  if (isSubmitted && submittedClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        {/* Header z przełącznikiem języka */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-blue-100 text-sm">{t.subtitle}</p>
              </div>
            </div>
            <LanguageSwitcher 
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">{t.success.title}</CardTitle>
              <CardDescription className="text-gray-600">
                {t.success.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Podsumowanie */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">{t.success.summary}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t.form.name}:</span>
                    <p className="text-gray-600">{submittedClient.Name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t.form.email}:</span>
                    <p className="text-gray-600">{submittedClient.Email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t.form.phone}:</span>
                    <p className="text-gray-600">{submittedClient.Phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t.form.purpose}:</span>
                    <p className="text-gray-600">{submittedClient.CelPobytu}</p>
                  </div>
                </div>
              </div>

              {/* Następne kroki */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800">{t.success.nextSteps}</h3>
                <ul className="text-sm space-y-1 text-blue-700">
                  {t.success.steps.map((step, index) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>

              {/* Przyciski */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleNewForm} 
                  variant="outline" 
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.success.newApplication}
                </Button>
                <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <a href="https://easy-move.pl" target="_blank" rel="noopener noreferrer">
                    {t.success.homepage}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Główny formularz
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header z gradientem */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            {/* Logo i tytuł */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">{t.title}</h1>
                <p className="text-blue-100 text-lg">{t.subtitle}</p>
              </div>
            </div>

            {/* Przełącznik języka */}
            <LanguageSwitcher 
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
          </div>

          {/* Opis */}
          <p className="text-blue-50 text-lg mt-6 max-w-3xl">
            {t.description}
          </p>

          {/* Benefity */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">{t.benefits.consultation}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm font-medium">{t.benefits.response}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm font-medium">{t.benefits.advisory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formularz */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-xl border-0 overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <CardTitle className="text-2xl text-gray-800">{t.form.title}</CardTitle>
            <CardDescription className="text-gray-600">
              {t.form.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 lg:p-8 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Imię i nazwisko */}
                <FormField
                  control={form.control}
                  name="Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        {t.form.name} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t.placeholders.name}
                          {...field} 
                          disabled={isLoading}
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email i Telefon */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="Email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.form.email} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder={t.placeholders.email}
                            {...field} 
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="Phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.form.phone} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholders.phone}
                            {...field} 
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cel pobytu i Kraj */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="CelPobytu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.form.purpose} <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                              <SelectValue placeholder={t.placeholders.purpose} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Praca">{t.purposes.work}</SelectItem>
                            <SelectItem value="Nauka">{t.purposes.study}</SelectItem>
                            <SelectItem value="Połączenie z rodziną">{t.purposes.family}</SelectItem>
                            <SelectItem value="Inne">{t.purposes.other}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.form.country} <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()} 
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                              <SelectValue placeholder={t.placeholders.country} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id.toString()}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Upload plików */}
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-700 font-medium">{t.form.files}</label>
                    <p className="text-sm text-gray-500 mt-1">
                      {t.form.filesDescription}
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 bg-white hover:text-black"
                    >
                      {t.selectFiles}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelection}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Lista plików */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {t.selectedFiles} ({uploadedFiles.length}):
                      </p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{file.name}</p>
                              <p className="text-xs text-gray-500">{file.size}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      {isUploadingFiles ? t.form.uploadingFiles : t.form.submitting}
                    </div>
                  ) : (
                    t.form.submit
                  )}
                </Button>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 mb-1">{t.info.dataProcessing}</p>
                      <p className="text-blue-700">{t.info.dataDescription}</p>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            {t.footer.rights} | 
            <a href="https://easy-move.pl" className="ml-1 text-blue-600 hover:text-blue-700">
              easy-move.pl
            </a>
          </p>
          <p className="text-sm mt-2">{t.footer.contact}</p>
        </div>
      </footer>
    </div>
  )
} 