"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { HelpCircle } from "lucide-react"

const ticketFormSchema = z.object({
  title: z.string().min(2, {
    // Poprawiono: TytuÄ¹â€š -> Tytuł, mieÃ„â€¡ -> mieć
    message: "Tytuł musi mieć minimum 2 znaki.",
  }),
  topic: z.string({
    // Poprawiono: ProszÃ„â„¢ -> Proszę, wybraÃ„â€¡ -> wybrać
    required_error: "Proszę wybrać temat.",
  }),
  message: z.string().min(10, {
    // Poprawiono: WiadomoÄ¹â€ºÃ„â€¡ -> Wiadomość, mieÃ„â€¡ -> mieć, znakÄ‚Å‚w -> znaków
    message: "Wiadomość musi mieć minimum 10 znaków.",
  }),
})

type TicketFormValues = z.infer<typeof ticketFormSchema>

export function SupportTicketModal() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      topic: "",
      message: "",
    },
  })

  async function onSubmit(data: TicketFormValues) {
    try {
      setIsSubmitting(true)
      
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        // Poprawiono: BÄ¹â€šÃ„â€¦d -> Błąd, wysyÄ¹â€šania -> wysyłania
        throw new Error("Błąd podczas wysyłania ticketu")
      }
      
      // Poprawiono: zostaÄ¹â€š -> został, wysÄ¹â€šany -> wysłany, pomyÄ¹â€ºlnie -> pomyślnie
      toast.success("Ticket został wysłany pomyślnie!")
      setOpen(false)
      form.reset()
    } catch (error) {
      // Poprawiono: WystÃ„â€¦piÄ¹â€š -> Wystąpił, bÄ¹â€šÃ„â€¦d -> błąd, wysyÄ¹â€šania -> wysyłania
      toast.error("Wystąpił błąd podczas wysyłania ticketu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Poprawiono: WysyÄ¹â€šanie -> Wysyłanie */}
          <DialogTitle>Wysyłanie ticketu</DialogTitle>
          <DialogDescription>
            {/* Poprawiono: swÄ‚Å‚j -> swój, sugestiÃ„â„¢ -> sugestię, siÃ„â„¢ -> się, odpowiedzieÃ„â€¡ -> odpowiedzieć */}
            Opisz swój problem lub sugestię. Postaramy się odpowiedzieć jak najszybciej.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  {/* Poprawiono: TytuÄ¹â€š -> Tytuł */}
                  <FormLabel>Tytuł</FormLabel>
                  <FormControl>
                    {/* Poprawiono: KrÄ‚Å‚tki -> Krótki */}
                    <Input placeholder="Krótki opis problemu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temat</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz temat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical">Problem techniczny</SelectItem>
                      <SelectItem value="suggestion">Sugestia</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  {/* Poprawiono: WiadomoÄ¹â€ºÃ„â€¡ -> Wiadomość */}
                  <FormLabel>Wiadomość</FormLabel>
                  <FormControl>
                    <Textarea
                      // Poprawiono: szczegÄ‚Å‚Ä¹â€šowo -> szczegółowo, swÄ‚Å‚j -> swój, sugestiÃ„â„¢ -> sugestię
                      placeholder="Opisz szczegółowo swój problem lub sugestię..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {/* Poprawiono: WysyÄ¹â€šanie -> Wysyłanie, WyÄ¹â€ºlij -> Wyślij */}
              {isSubmitting ? "Wysyłanie..." : "Wyślij ticket"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}