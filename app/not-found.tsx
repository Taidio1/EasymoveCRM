// Wymuszenie dynamicznego renderowania strony
export const dynamic = 'force-dynamic'

import FallbackPage from './fallback-page'

export default function NotFound() {
  return (
    <FallbackPage 
      title="Nie znaleziono strony" 
      message="Strona, ktĂłrej szukasz, nie istnieje lub zostaĹ‚a przeniesiona." 
    />
  )
} 