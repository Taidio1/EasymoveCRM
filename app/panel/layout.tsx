import { PanelGuard } from "@/components/panel/panel-guard"
import { PanelBottomNav } from "@/components/panel/bottom-nav"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard>
      <div className="flex flex-col min-h-screen bg-bg">
        <main className="flex-1 overflow-y-auto pb-[72px]">
          <div className="mx-auto w-full max-w-md p-4">{children}</div>
        </main>
        <PanelBottomNav />
      </div>
    </PanelGuard>
  )
}
