import { useState, useEffect } from "react"

// Initializes to false for SSR safety — no hydration mismatch in Next.js.
// After mount, syncs to actual viewport width and tracks resize.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])

  return isMobile
}
