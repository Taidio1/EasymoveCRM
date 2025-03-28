import ClientTable from "@/components/client-table"
import MainLayout from "@/components/main-layout"

// Wymuszenie dynamicznego renderowania
export const dynamic = 'force-dynamic'

export default function ClientsPage() {
  return (
    <MainLayout>
      <ClientTable />
    </MainLayout>
  )
}

