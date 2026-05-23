'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface HeroSearchProps {
  locale: string
  placeholder: string
  btnLabel: string
}

export default function HeroSearch({ locale, placeholder, btnLabel }: HeroSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push(`/${locale}/search`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl mx-auto">
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-white rounded-l-xl text-sm border-y border-l border-border focus:outline-none focus:border-brand"
        />
      </div>
      <button
        type="submit"
        className="bg-brand text-white font-semibold px-6 py-3.5 rounded-r-xl hover:bg-brand-dark transition-colors text-sm flex-shrink-0"
      >
        {btnLabel}
      </button>
    </form>
  )
}
