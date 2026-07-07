"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator) ||
      !window.isSecureContext
    ) {
      return
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker registration failed", error)
      })
    }

    if (document.readyState === "complete") {
      registerServiceWorker()
      return
    }

    window.addEventListener("load", registerServiceWorker)

    return () => {
      window.removeEventListener("load", registerServiceWorker)
    }
  }, [])

  return null
}
