import { Metadata } from "next"
import { ClientRegistrationForm } from "@/components/client-registration-form"

export const metadata: Metadata = {
  title: "Wniosek o legalizację pobytu | Easy Move",
  description: "Wypełnij formularz, aby rozpocząć proces legalizacji pobytu w Polsce z Easy Move",
}

export default function FormPage() {
  return <ClientRegistrationForm />
} 