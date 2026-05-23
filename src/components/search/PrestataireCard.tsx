import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import type { PrestataireCard as PrestataireCardType } from '@/types'
import StarRating from '@/components/ui/StarRating'
import Avatar from '@/components/ui/Avatar'

interface Props {
  prestataire: PrestataireCardType
  locale: string
}

export default function PrestataireCard({ prestataire: p, locale }: Props) {
  const metierName = locale === 'fr' ? p.metier.name_fr : p.metier.name_en
  const cityLabel = p.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'

  return (
    <Link
      href={`/${locale}/prestataires/${p.id}`}
      className="card group flex flex-col"
    >
      {/* Top colored strip */}
      <div className={clsx('h-2 w-full', p.is_featured ? 'bg-brand' : 'bg-surface')} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={p.business_name} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-dark text-sm leading-tight truncate group-hover:text-brand transition-colors">
              {p.business_name}
            </h3>
            <p className="text-xs text-soft mt-0.5">
              {p.metier.icon} {metierName}
            </p>
          </div>
          {p.subscription_tier === 'premium' && (
            <span className="badge-premium flex-shrink-0">Premium</span>
          )}
        </div>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={p.avg_rating} count={p.total_reviews} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-soft mb-4">
          <MapPin size={12} className="flex-shrink-0" />
          <span>{p.neighborhood ? `${p.neighborhood}, ` : ''}{cityLabel}</span>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          <span className="badge-verified text-xs">Vérifié ✓</span>
          {p.phone_public && (
            <span className="flex items-center gap-1 text-xs text-mid">
              <Phone size={11} />
              {p.phone_public}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
