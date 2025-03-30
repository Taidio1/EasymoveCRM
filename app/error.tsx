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
      title="WystÄ…piĹ‚ bĹ‚Ä…d" 
      message="Przepraszamy, wystÄ…piĹ‚ nieoczekiwany problem podczas Ĺ‚adowania strony." 
    />
  )
} 