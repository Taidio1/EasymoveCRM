"use client"

import { useState } from 'react'
import { type Language } from '@/lib/i18n'

interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
      <button
        onClick={() => onLanguageChange('pl')}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
          ${currentLanguage === 'pl' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-white hover:text-blue-100 hover:bg-white/10'
          }
        `}
      >
        PL
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
          ${currentLanguage === 'en' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-white hover:text-blue-100 hover:bg-white/10'
          }
        `}
      >
        EN
      </button>
    </div>
  )
} 