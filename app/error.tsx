'use client'

import FallbackPage from './fallback-page'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <FallbackPage 
      title="Wystąpił błąd" 
      message="Przepraszamy, wystąpił nieoczekiwany problem podczas ładowania strony." 
    />
  )
} 