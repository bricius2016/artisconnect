import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Metier } from '@/types'
import PrestataireCard from '@/components/search/PrestataireCard'
import SearchFilters from '@/components/search/SearchFilters'
import { SlidersHorizontal } from 'lucide-react'
import { toCard, type RawPrestataire } from '@/lib/mappers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recherche de prestataires',
  description: 'Recherchez parmi des centaines d\'artisans et prestataires vérifiés à Ouagadougou et Bobo-Dioulasso.',
}

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    metier?: string
    category?: string
    city?: string
    min_rating?: string
    verified_only?: string
    sort_by?: string
  }>
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations('search')

  const supabase = await createServerSupabaseClient()

  const { data: metiers } = await supabase
    .from('metiers')
    .select('id, name_fr, name_en, slug, icon, category')
    .eq('is_active', true)
    .order('name_fr')

  let query = supabase
    .from('prestataire_profiles')
    .select(`
      id, business_name, user_id, city, neighborhood,
      avg_rating, total_reviews, subscription_tier, is_featured,
      account_status, phone_public, whatsapp,
      metiers!inner(name_fr, name_en, slug, icon)
    `)
    .eq('account_status', 'verified')

  if (filters.metier) {
    const metier = (metiers as Metier[])?.find(m => m.slug === filters.metier)
    if (metier) query = query.eq('metier_id', metier.id)
  }

  if (filters.category) {
    const categoryMetierIds = (metiers as Metier[])
      ?.filter(m => m.category === filters.category)
      .map(m => m.id)
    if (categoryMetierIds?.length) query = query.in('metier_id', categoryMetierIds)
  }

  if (filters.city) {
    query = query.eq('city', filters.city as 'ouagadougou' | 'bobo_dioulasso')
  }

  if (filters.min_rating) {
    query = query.gte('avg_rating', parseFloat(filters.min_rating))
  }

  const sortBy = filters.sort_by || 'featured'
  if (sortBy === 'rating') query = query.order('avg_rating', { ascending: false })
  else if (sortBy === 'reviews') query = query.order('total_reviews', { ascending: false })
  else {
    query = query.order('is_featured', { ascending: false }).order('avg_rating', { ascending: false })
  }

  query = query.limit(48)

  const { data: prestataires } = await query

  let results = ((prestataires as RawPrestataire[]) ?? []).map(toCard)

  if (filters.q) {
    const q = filters.q.toLowerCase()
    results = results.filter(p =>
      p.business_name.toLowerCase().includes(q) ||
      p.metier.name_fr.toLowerCase().includes(q) ||
      p.metier.name_en.toLowerCase().includes(q)
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filtres */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={16} className="text-brand" />
              <h2 className="font-bold text-dark text-sm">{t('filters')}</h2>
            </div>
            <SearchFilters
              locale={locale}
              metiers={(metiers as Metier[]) ?? []}
              current={filters}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-mid">
              {filters.q && <span className="font-semibold text-dark">«{filters.q}» — </span>}
              {t('results', { count: results.length })}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-semibold text-dark text-lg">{t('no_results')}</p>
              <p className="text-sm text-mid mt-2">{t('no_results_sub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((p) => (
                <PrestataireCard key={p.id} prestataire={p} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
