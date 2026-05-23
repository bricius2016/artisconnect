import type { PrestataireCard } from '@/types'

// Supabase returns joined relations as arrays; these mappers normalize them.

export interface RawPrestataire {
  id: string
  business_name: string
  user_id: string
  city: 'ouagadougou' | 'bobo_dioulasso'
  neighborhood: string | null
  avg_rating: number | null
  total_reviews: number
  subscription_tier: 'free' | 'premium'
  is_featured: boolean
  account_status: string
  phone_public: string | null
  whatsapp: string | null
  metiers: { name_fr: string; name_en: string; slug: string; icon: string | null } | { name_fr: string; name_en: string; slug: string; icon: string | null }[] | null
  cover_image?: string | null
}

export function toCard(raw: RawPrestataire): PrestataireCard {
  const metierRaw = Array.isArray(raw.metiers) ? raw.metiers[0] : raw.metiers
  return {
    ...raw,
    account_status: raw.account_status as PrestataireCard['account_status'],
    metier: {
      name_fr: metierRaw?.name_fr ?? '',
      name_en: metierRaw?.name_en ?? '',
      slug: metierRaw?.slug ?? '',
      icon: metierRaw?.icon ?? null,
    },
  }
}
