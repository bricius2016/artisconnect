import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Calendar, MapPin, Banknote, Users, Plus } from 'lucide-react'
import type { AppelOffre } from '@/types'
import Badge from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Appels d'offres",
  description: "Consultez les appels d'offres ouverts au Burkina Faso. Prestataires : candidatez en quelques clics.",
}

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; city?: string }>
}

const STATUS_BADGE: Record<string, 'open' | 'closing_soon' | 'closed' | 'awarded'> = {
  open: 'open',
  closing_soon: 'closing_soon',
  closed: 'closed',
  awarded: 'awarded',
}

export default async function AOPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations('ao')
  const tCommon = await getTranslations('common')

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? null
  }

  let query = supabase
    .from('appels_offres')
    .select(`
      *,
      entreprise_profiles!appels_offres_entreprise_id_fkey(company_name, city),
      metiers(name_fr, name_en, icon)
    `)
    .in('status', filters.status ? [filters.status] : ['open', 'closing_soon'])
    .order('created_at', { ascending: false })

  if (filters.city) {
    query = query.eq('city', filters.city as 'ouagadougou' | 'bobo_dioulasso')
  }

  const { data: aos } = await query.limit(30)

  const href = (path: string) => `/${locale}${path}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">{t('title')}</h1>
          <p className="text-sm text-soft mt-1">{aos?.length ?? 0} appels d&apos;offres actifs</p>
        </div>
        {(userRole === 'entreprise' || userRole === 'admin') && (
          <Link href={href('/ao/new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            {t('publish')}
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: '', label: 'Tous les AO actifs' },
          { value: 'open', label: t('open') },
          { value: 'closing_soon', label: t('closing_soon') },
          { value: 'closed', label: t('closed') },
        ].map((f) => (
          <Link
            key={f.value}
            href={href(`/ao${f.value ? `?status=${f.value}` : ''}`)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (filters.status ?? '') === f.value
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-mid border-border hover:border-brand hover:text-brand'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* AO list */}
      {!aos || aos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold text-dark">Aucun appel d&apos;offres pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {aos.map((ao) => {
            const metierName = locale === 'fr' ? ao.metiers?.name_fr : ao.metiers?.name_en
            const city = ao.city === 'ouagadougou' ? tCommon('ouagadougou') : tCommon('bobo_dioulasso')
            const deadline = ao.deadline ? new Date(ao.deadline).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null

            return (
              <Link
                key={ao.id}
                href={href(`/ao/${ao.id}`)}
                className="card block p-6 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={STATUS_BADGE[ao.status] ?? 'open'} label={t(ao.status as 'open' | 'closing_soon' | 'closed' | 'awarded')} />
                      {metierName && (
                        <span className="text-xs bg-surface text-mid px-2.5 py-1 rounded-full border border-border">
                          {ao.metiers?.icon} {metierName}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-dark text-base leading-tight mb-1">{ao.title}</h2>
                    <p className="text-sm text-mid line-clamp-2 mb-3">{ao.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-soft">
                      <span className="flex items-center gap-1"><MapPin size={11} />{city}</span>
                      {(ao.budget_min || ao.budget_max) && (
                        <span className="flex items-center gap-1">
                          <Banknote size={11} />
                          {ao.budget_min ? `${ao.budget_min.toLocaleString('fr-FR')} ` : ''}
                          {ao.budget_max ? `– ${ao.budget_max.toLocaleString('fr-FR')} FCFA` : 'FCFA'}
                        </span>
                      )}
                      {deadline && (
                        <span className="flex items-center gap-1"><Calendar size={11} />Avant le {deadline}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {t('responses', { count: ao.responses_count })}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-soft flex-shrink-0 text-right">
                    <p className="font-medium text-mid">{ao.entreprise_profiles?.company_name}</p>
                    <p>{new Date(ao.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
