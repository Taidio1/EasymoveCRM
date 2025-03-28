// Wymuszenie dynamicznego renderowania strony
export const dynamic = 'force-dynamic'

import FallbackPage from './fallback-page'

export default function NotFound() {
  return (
    <FallbackPage 
      title="Nie znaleziono strony" 
      message="Strona, której szukasz, nie istnieje lub została przeniesiona." 
    />
  )
} 