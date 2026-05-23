import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, MapPin, Banknote } from 'lucide-react'
import Badge from '@/components/ui/Badge'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function CandidaturesPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: pp } = await supabase
    .from('prestataire_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pp) redirect(`/${locale}/dashboard/profil`)

  const { data: candidatures } = await supabase
    .from('ao_responses')
    .select(`
      id, message, proposed_budget, status, created_at,
      appels_offres!ao_responses_ao_id_fkey(
        id, title, status, city, budget_min, budget_max, deadline,
        entreprise_profiles!appels_offres_entreprise_id_fkey(company_name)
      )
    `)
    .eq('prestataire_id', pp.id)
    .order('created_at', { ascending: false })

  const responseStatus = (s: string) => ({
    pending:  { label: 'En attente',   icon: Clock,        color: 'text-amber-500 bg-amber-50' },
    accepted: { label: 'Acceptée ✓',   icon: CheckCircle,  color: 'text-verified bg-green-50' },
    rejected: { label: 'Non retenue',  icon: XCircle,      color: 'text-red-500 bg-red-50' },
  }[s] ?? { label: s, icon: Clock, color: 'text-soft bg-surface' })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Mes candidatures</h1>
          <p className="text-sm text-soft mt-0.5">{candidatures?.length ?? 0} candidature{(candidatures?.length ?? 0) > 1 ? 's' : ''} soumise{(candidatures?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
      </div>

      {(!candidatures || candidatures.length === 0) && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📨</div>
          <p className="font-semibold text-dark">Aucune candidature</p>
          <p className="text-sm text-soft mt-1 mb-6">Consultez les appels d&apos;offres ouverts et postulez.</p>
          <Link href={`/${locale}/ao`} className="btn-primary inline-block text-sm">
            Voir les appels d&apos;offres
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {(candidatures ?? []).map((c: any) => {
          const ao = Array.isArray(c.appels_offres) ? c.appels_offres[0] : c.appels_offres
          const ep = ao ? (Array.isArray(ao.entreprise_profiles) ? ao.entreprise_profiles[0] : ao.entreprise_profiles) : null
          const rs = responseStatus(c.status)
          const RsIcon = rs.icon

          return (
            <div key={c.id} className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <Link href={`/${locale}/ao/${ao?.id}`} className="font-bold text-dark hover:text-brand transition-colors line-clamp-1">
                    {ao?.title}
                  </Link>
                  <p className="text-xs text-soft mt-0.5">{ep?.company_name} · Candidature le {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${rs.color}`}>
                  <RsIcon size={12} /> {rs.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-soft">
                {ao?.city && <span className="flex items-center gap-1"><MapPin size={10} />{ao.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'}</span>}
                {(ao?.budget_min || ao?.budget_max) && (
                  <span className="flex items-center gap-1">
                    <Banknote size={10} />
                    {ao.budget_min?.toLocaleString('fr-FR')}{ao.budget_max ? ` – ${ao.budget_max.toLocaleString('fr-FR')}` : '+'} FCFA
                  </span>
                )}
                {ao?.deadline && <span>Clôture le {new Date(ao.deadline).toLocaleDateString('fr-FR')}</span>}
                {c.proposed_budget && <span className="text-brand font-semibold">Mon budget : {c.proposed_budget.toLocaleString('fr-FR')} FCFA</span>}
              </div>

              <div className="pl-3 border-l-2 border-border">
                <p className="text-xs text-mid line-clamp-2">{c.message}</p>
              </div>

              {ao?.status && (
                <div className="flex items-center justify-between">
                  <Badge
                    variant={(ao.status as 'open' | 'closing_soon' | 'closed' | 'awarded') ?? 'open'}
                    label={ao.status === 'open' ? 'AO ouvert' : ao.status === 'closing_soon' ? 'Clôture imminente' : ao.status === 'closed' ? 'AO clôturé' : 'Attribué'}
                  />
                  <Link href={`/${locale}/ao/${ao.id}`} className="text-xs text-brand hover:text-brand-dark font-medium">
                    Voir l&apos;AO →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
