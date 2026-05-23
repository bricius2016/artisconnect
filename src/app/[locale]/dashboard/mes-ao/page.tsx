import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ResponseButtons from '@/components/dashboard/ResponseButtons'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function MesAOPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['entreprise', 'admin'].includes(profile.role)) redirect(`/${locale}/dashboard`)

  const { data: ep } = await supabase.from('entreprise_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!ep) redirect(`/${locale}/dashboard/entreprise/profil`)

  const { data: aos } = await supabase
    .from('appels_offres')
    .select(`
      id, title, status, responses_count, created_at, deadline,
      ao_responses(
        id, message, proposed_budget, status, created_at,
        prestataire_profiles!ao_responses_prestataire_id_fkey(
          id, business_name,
          profiles!prestataire_profiles_user_id_fkey(first_name, last_name)
        )
      )
    `)
    .eq('entreprise_id', ep.id)
    .order('created_at', { ascending: false })

  const statusLabel = (s: string) =>
    s === 'open' ? 'Ouvert' : s === 'closing_soon' ? 'Clôture imminente' : s === 'closed' ? 'Clôturé' : 'Attribué'

  const responseStatusIcon = (s: string) => {
    if (s === 'accepted') return <CheckCircle size={12} className="text-verified" />
    if (s === 'rejected') return <XCircle size={12} className="text-red-500" />
    return <Clock size={12} className="text-amber-500" />
  }

  const responseStatusLabel = (s: string) =>
    s === 'accepted' ? 'Acceptée' : s === 'rejected' ? 'Refusée' : 'En attente'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark">Mes appels d&apos;offres</h1>
            <p className="text-sm text-soft mt-0.5">{aos?.length ?? 0} AO publié{(aos?.length ?? 0) > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link href={`/${locale}/ao/new`}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={15} /> Nouvel AO
        </Link>
      </div>

      {(!aos || aos.length === 0) && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold text-dark">Aucun appel d&apos;offres publié</p>
          <p className="text-sm text-soft mt-1 mb-6">Publiez votre premier AO pour recevoir des candidatures.</p>
          <Link href={`/${locale}/ao/new`} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={15} /> Publier un AO
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {(aos ?? []).map((ao) => {
          const responses = (Array.isArray(ao.ao_responses) ? ao.ao_responses : []) as any[]
          return (
            <div key={ao.id} className="bg-white border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-start justify-between gap-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={(ao.status as 'open' | 'closing_soon' | 'closed' | 'awarded') ?? 'open'}
                      label={statusLabel(ao.status)}
                    />
                  </div>
                  <Link href={`/${locale}/ao/${ao.id}`} className="font-bold text-dark hover:text-brand transition-colors line-clamp-1">
                    {ao.title}
                  </Link>
                  <p className="text-xs text-soft mt-1">
                    Publié le {new Date(ao.created_at).toLocaleDateString('fr-FR')}
                    {ao.deadline && ` · Clôture le ${new Date(ao.deadline).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-dark flex-shrink-0">
                  <Users size={15} className="text-soft" />
                  {ao.responses_count}
                </div>
              </div>

              {/* Candidatures */}
              {responses.length === 0 ? (
                <p className="text-sm text-soft text-center py-6">Aucune candidature reçue pour l&apos;instant.</p>
              ) : (
                <div className="divide-y divide-border">
                  {responses.map((r: any) => {
                    const pp = Array.isArray(r.prestataire_profiles) ? r.prestataire_profiles[0] : r.prestataire_profiles
                    const owner = Array.isArray(pp?.profiles) ? pp?.profiles[0] : pp?.profiles
                    return (
                      <div key={r.id} className="px-5 py-4 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-dark text-sm">{pp?.business_name}</p>
                            <span className="flex items-center gap-1 text-xs text-soft">
                              {responseStatusIcon(r.status)} {responseStatusLabel(r.status)}
                            </span>
                          </div>
                          <p className="text-xs text-soft mb-1.5">{owner?.first_name} {owner?.last_name}</p>
                          <p className="text-sm text-mid line-clamp-2">{r.message}</p>
                          {r.proposed_budget && (
                            <p className="text-xs text-brand font-semibold mt-1">
                              Budget : {r.proposed_budget.toLocaleString('fr-FR')} FCFA
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.status === 'pending' && <ResponseButtons aoResponseId={r.id} />}
                          {pp?.id && (
                            <Link href={`/${locale}/prestataires/${pp.id}`}
                              className="text-xs px-3 py-1.5 border border-border rounded-lg text-mid hover:border-brand hover:text-brand transition-colors">
                              Profil
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
