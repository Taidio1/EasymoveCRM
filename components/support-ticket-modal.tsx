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
    message: "TytuÄ¹â musi mieÃâ¡ minimum 2 znaki.",
  }),
  topic: z.string({
    required_error: "ProszÃâ¢ wybraÃâ¡ temat.",
  }),
  message: z.string().min(10, {
    message: "WiadomoÄ¹âºÃâ¡ musi mieÃâ¡ minimum 10 znakÄÅw.",
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
        throw new Error("BÄ¹âÃâ¦d podczas wysyÄ¹âania ticketu")
      }
      
      toast.success("Ticket zostaÄ¹â wysÄ¹âany pomyÄ¹âºlnie!")
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error("WystÃâ¦piÄ¹â bÄ¹âÃâ¦d podczas wysyÄ¹âania ticketu.")
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
          <DialogTitle>WysyÄ¹âanie ticketu</DialogTitle>
          <DialogDescription>
            Opisz swÄÅj problem lub sugestiÃâ¢. Postaramy siÃâ¢ odpowiedzieÃâ¡ jak najszybciej.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TytuÄ¹â</FormLabel>
                  <FormControl>
                    <Input placeholder="KrÄÅtki opis problemu" {...field} />
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
                  <FormLabel>WiadomoÄ¹âºÃâ¡</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opisz szczegÄÅÄ¹âowo swÄÅj problem lub sugestiÃâ¢..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "WysyÄ¹âanie..." : "WyÄ¹âºlij ticket"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 