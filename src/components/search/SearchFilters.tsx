'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { Metier } from '@/types'

interface Props {
  locale: string
  metiers: Metier[]
  current: {
    q?: string
    metier?: string
    city?: string
    min_rating?: string
    verified_only?: string
    sort_by?: string
    category?: string
  }
}

export default function SearchFilters({ locale, metiers, current }: Props) {
  const t = useTranslations('search')
  const router = useRouter()
  const pathname = usePathname()

  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams()
    const merged = { ...current, [key]: value }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`${pathname}?${params.toString()}`)
  }, [current, pathname, router])

  const reset = () => router.push(pathname)

  const sortOptions = [
    { value: 'featured', label: 'En vedette' },
    { value: 'rating', label: t('sort_rating') },
    { value: 'reviews', label: t('sort_reviews') },
  ]

  const ratingOptions = [
    { value: '4', label: '4★ et plus' },
    { value: '3', label: '3★ et plus' },
  ]

  return (
    <div className="space-y-5">
      {/* Métier */}
      <div>
        <label className="label">{t('metier')}</label>
        <select
          value={current.metier ?? ''}
          onChange={(e) => updateFilter('metier', e.target.value || undefined)}
          className="input text-sm"
        >
          <option value="">{t('all_metiers')}</option>
          {metiers.map((m) => (
            <option key={m.id} value={m.slug}>{m.icon} {m.name_fr}</option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div>
        <label className="label">{t('city')}</label>
        <select
          value={current.city ?? ''}
          onChange={(e) => updateFilter('city', e.target.value || undefined)}
          className="input text-sm"
        >
          <option value="">{t('all_zones')}</option>
          <option value="ouagadougou">Ouagadougou</option>
          <option value="bobo_dioulasso">Bobo-Dioulasso</option>
        </select>
      </div>

      {/* Note min */}
      <div>
        <label className="label">{t('min_rating')}</label>
        <select
          value={current.min_rating ?? ''}
          onChange={(e) => updateFilter('min_rating', e.target.value || undefined)}
          className="input text-sm"
        >
          <option value="">{t('all_ratings')}</option>
          {ratingOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Trier par */}
      <div>
        <label className="label">{t('sort_by')}</label>
        <select
          value={current.sort_by ?? 'featured'}
          onChange={(e) => updateFilter('sort_by', e.target.value)}
          className="input text-sm"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {(current.metier || current.city || current.min_rating || current.q) && (
        <button
          onClick={reset}
          className="w-full text-sm text-mid hover:text-brand border border-border rounded-xl py-2 hover:border-brand transition-colors"
        >
          {t('reset')}
        </button>
      )}
    </div>
  )
}
