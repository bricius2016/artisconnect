import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Banknote, Users, Building, Download } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import AOResponseForm from '@/components/ao/AOResponseForm'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('appels_offres')
    .select('title, description, city, entreprise_profiles!appels_offres_entreprise_id_fkey(company_name)')
    .eq('id', id)
    .single()

  if (!data) return { title: "Appel d'offres introuvable" }

  const ep = Array.isArray(data.entreprise_profiles) ? data.entreprise_profiles[0] : data.entreprise_profiles
  const city = data.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'

  return {
    title: data.title,
    description: `${ep?.company_name ?? 'Entreprise'} · ${city} — ${data.description?.slice(0, 120)}…`,
    openGraph: {
      title: `${data.title} | ArtisConnect`,
      description: data.description?.slice(0, 200),
    },
  }
}

const STATUS_BADGE: Record<string, 'open' | 'closing_soon' | 'closed' | 'awarded'> = {
  open: 'open', closing_soon: 'closing_soon', closed: 'closed', awarded: 'awarded',
}

export default async function AODetailPage({ params }: PageProps) {
  const { locale, id } = await params
  const t = await getTranslations('ao')
  const tCommon = await getTranslations('common')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ao } = await supabase
    .from('appels_offres')
    .select(`
      *,
      entreprise_profiles!appels_offres_entreprise_id_fkey(company_name, city, address, phone_public, website),
      metiers(name_fr, name_en, icon)
    `)
    .eq('id', id)
    .single()

  if (!ao) notFound()

  let userRole: string | null = null
  let prestataireId: string | null = null
  let hasApplied = false

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? null

    if (userRole === 'prestataire') {
      const { data: pp } = await supabase.from('prestataire_profiles').select('id').eq('user_id', user.id).single()
      prestataireId = pp?.id ?? null
      if (prestataireId) {
        const { data: existing } = await supabase.from('ao_responses').select('id').eq('ao_id', id).eq('prestataire_id', prestataireId).single()
        hasApplied = !!existing
      }
    }
  }

  const metierName = locale === 'fr' ? ao.metiers?.name_fr : ao.metiers?.name_en
  const city = ao.city === 'ouagadougou' ? tCommon('ouagadougou') : tCommon('bobo_dioulasso')
  const deadline = ao.deadline
    ? new Date(ao.deadline).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const isOpen = ['open', 'closing_soon'].includes(ao.status)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={STATUS_BADGE[ao.status] ?? 'open'} label={t(ao.status as 'open' | 'closing_soon' | 'closed' | 'awarded')} />
              {metierName && (
                <span className="text-xs bg-surface text-mid px-2.5 py-1 rounded-full border border-border">
                  {ao.metiers?.icon} {metierName}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-dark mb-4">{ao.title}</h1>
            <p className="text-sm text-mid leading-relaxed whitespace-pre-wrap">{ao.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-3 bg-surface rounded-xl">
                <p className="text-xs text-soft mb-1 flex items-center gap-1.5"><MapPin size={11} />{tCommon('ouagadougou').includes('oua') ? 'Ville' : 'City'}</p>
                <p className="text-sm font-semibold text-dark">{city}</p>
              </div>
              {(ao.budget_min || ao.budget_max) && (
                <div className="p-3 bg-surface rounded-xl">
                  <p className="text-xs text-soft mb-1 flex items-center gap-1.5"><Banknote size={11} />{t('budget')}</p>
                  <p className="text-sm font-semibold text-dark">
                    {ao.budget_min?.toLocaleString('fr-FR')}{ao.budget_max ? ` – ${ao.budget_max.toLocaleString('fr-FR')}` : '+'} FCFA
                  </p>
                </div>
              )}
              {deadline && (
                <div className="p-3 bg-surface rounded-xl">
                  <p className="text-xs text-soft mb-1 flex items-center gap-1.5"><Calendar size={11} />{t('deadline')}</p>
                  <p className="text-sm font-semibold text-dark">{deadline}</p>
                </div>
              )}
              <div className="p-3 bg-surface rounded-xl">
                <p className="text-xs text-soft mb-1 flex items-center gap-1.5"><Users size={11} />Candidatures</p>
                <p className="text-sm font-semibold text-dark">{t('responses', { count: ao.responses_count })}</p>
              </div>
            </div>
          </div>

          {/* DAO download */}
          {ao.dao_url && (
            <div className="bg-white border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-pale flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-dark text-sm">Dossier d&apos;appel d&apos;offres</p>
                <p className="text-xs text-soft mt-0.5">Document officiel fourni par l&apos;entreprise</p>
              </div>
              <a
                href={ao.dao_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                <Download size={14} /> Télécharger
              </a>
            </div>
          )}

          {/* Response form */}
          {userRole === 'prestataire' && isOpen && prestataireId && (
            <AOResponseForm
              aoId={ao.id}
              prestataireId={prestataireId}
              locale={locale}
              hasApplied={hasApplied}
            />
          )}

          {!user && isOpen && (
            <div className="bg-brand-pale border border-brand/20 rounded-2xl p-5 text-center">
              <p className="font-semibold text-dark mb-2">Vous êtes prestataire ?</p>
              <p className="text-sm text-mid mb-4">Connectez-vous pour candidater à cet appel d&apos;offres.</p>
              <a href={`/${locale}/auth/login?redirect=/${locale}/ao/${id}`} className="btn-primary text-sm">
                Se connecter pour candidater
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
                <Building size={18} className="text-mid" />
              </div>
              <div>
                <p className="font-semibold text-dark text-sm">{ao.entreprise_profiles?.company_name}</p>
                <p className="text-xs text-soft">{city}</p>
              </div>
            </div>
            {ao.entreprise_profiles?.address && (
              <p className="text-xs text-mid mb-1">{ao.entreprise_profiles.address}</p>
            )}
            {ao.entreprise_profiles?.phone_public && (
              <a href={`tel:${ao.entreprise_profiles.phone_public}`}
                className="text-xs text-brand hover:underline block">
                {ao.entreprise_profiles.phone_public}
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
