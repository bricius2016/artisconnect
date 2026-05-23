import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Star, FileText, User, Clock, CheckCircle, AlertCircle, ShieldCheck, Lock, Settings } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('dashboard')
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect(`/${locale}/auth/login`)

  const href = (path: string) => `/${locale}${path}`

  // Prestataire data
  let prestataireProfile = null
  let stats = { contacts: 0, reviews: 0 }

  if (profile.role === 'prestataire') {
    const { data: pp } = await supabase
      .from('prestataire_profiles')
      .select('id, account_status, total_reviews, business_name')
      .eq('user_id', user.id)
      .single()
    prestataireProfile = pp
    if (pp) {
      stats.reviews = pp.total_reviews ?? 0
      const { count: contactCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('prestataire_id', pp.id)
      stats.contacts = contactCount ?? 0
    }
  }

  // Unread messages
  const { count: unreadCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', user.id)

  const fullName = `${profile.first_name} ${profile.last_name}`
  const profileComplete = prestataireProfile !== null
  const accountStatus = prestataireProfile?.account_status ?? 'pending'
  const isVerified = accountStatus === 'verified'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar name={fullName} size="lg" />
        <div>
          <p className="text-sm text-soft">{t('welcome')},</p>
          <h1 className="text-2xl font-bold text-dark">{fullName}</h1>
          <span className="text-xs bg-surface text-mid border border-border px-2 py-0.5 rounded-full capitalize">{profile.role}</span>
        </div>
      </div>

      {/* Prestataire onboarding — profile not yet created */}
      {profile.role === 'prestataire' && !profileComplete && (
        <div className="mb-8 bg-white border border-brand rounded-2xl p-6">
          <h2 className="font-bold text-dark mb-1">Bienvenue sur ArtisConnect !</h2>
          <p className="text-sm text-soft mb-5">Suivez ces étapes pour que votre profil soit visible par les clients.</p>
          <div className="space-y-3">
            <OnboardingStep num={1} title="Créer votre profil professionnel" desc="Renseignez vos informations, votre métier et vos tarifs." active href={href('/dashboard/profil')} />
            <OnboardingStep num={2} title="Envoyer vos documents" desc="RCCM et pièce d'identité pour vérification." locked />
            <OnboardingStep num={3} title="Vérification et activation" desc="Notre équipe valide votre compte sous 48h." locked />
          </div>
        </div>
      )}

      {/* Validation banner after profile created but not verified */}
      {profile.role === 'prestataire' && profileComplete && !isVerified && accountStatus !== 'rejected' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {accountStatus === 'pending' ? 'Compte en attente de vérification' : 'Documents en cours d\'examen'}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {accountStatus === 'pending'
                ? 'Uploadez vos documents pour accélérer la vérification.'
                : 'Notre équipe examine vos documents. Vous serez notifié sous 48h.'}
            </p>
            {accountStatus === 'pending' && (
              <Link href={href('/dashboard/validation')} className="text-xs font-semibold text-amber-700 underline mt-1 inline-block">
                Envoyer mes documents →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {profile.role === 'prestataire' && accountStatus === 'rejected' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-dark">Dossier refusé</p>
            <p className="text-xs text-mid mt-0.5">Contactez le support pour plus d&apos;informations.</p>
          </div>
        </div>
      )}

      {/* Stats cards — only when profile exists */}
      {profile.role === 'prestataire' && profileComplete && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label={t('contacts')} value={stats.contacts} icon={MessageCircle} color="text-brand" bg="bg-brand-pale" />
          <StatCard label={t('my_reviews')} value={stats.reviews} icon={Star} color="text-amber-500" bg="bg-amber-50" />
          {(unreadCount ?? 0) > 0 && (
            <Link href={href('/messages')} className="bg-brand border border-brand rounded-2xl p-5 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <MessageCircle size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{unreadCount}</p>
              <p className="text-xs text-white/70 mt-0.5">Message{(unreadCount ?? 0) > 1 ? 's' : ''} non lu{(unreadCount ?? 0) > 1 ? 's' : ''}</p>
            </Link>
          )}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profile.role === 'prestataire' && (
          <>
            <DashboardCard
              href={href('/dashboard/profil')}
              icon={User}
              title={t('my_profile')}
              desc="Modifier votre profil public, vos tarifs, vos compétences"
              badge={isVerified ? 'verified' : 'pending'}
            />
            <DashboardCard
              href={href('/dashboard/candidatures')}
              icon={FileText}
              title="Mes candidatures"
              desc="Suivez vos candidatures sur les appels d'offres"
            />
            <DashboardCard
              href={profileComplete ? href('/dashboard/validation') : undefined}
              icon={ShieldCheck}
              title="Vérification du compte"
              desc={
                isVerified ? 'Compte vérifié — visible dans la recherche'
                  : accountStatus === 'step1_done' || accountStatus === 'step2_done' ? 'Documents en cours d\'examen'
                  : 'Envoyez vos documents pour être vérifié'
              }
              badge={isVerified ? 'verified' : 'pending'}
              locked={!profileComplete}
            />
            <DashboardCard
              href={profileComplete ? href('/dashboard/realisations') : undefined}
              icon={FileText}
              title="Mes réalisations"
              desc="Gérez votre portfolio de travaux et projets"
              locked={!profileComplete}
            />
            <DashboardCard
              href={href('/dashboard/avis')}
              icon={Star}
              title={t('my_reviews')}
              desc="Consultez et répondez aux avis de vos clients"
            />
          </>
        )}

        <DashboardCard
          href={href('/messages')}
          icon={MessageCircle}
          title={t('my_messages')}
          desc="Consultez vos conversations avec les clients"
          unread={unreadCount ?? 0}
        />

        {profile.role === 'client' && (
          <DashboardCard
            href={href('/search')}
            icon={User}
            title="Trouver un prestataire"
            desc="Recherchez des artisans vérifiés près de chez vous"
          />
        )}

        {profile.role === 'entreprise' && (
          <>
            <DashboardCard
              href={href('/dashboard/entreprise/profil')}
              icon={User}
              title="Profil de l'entreprise"
              desc="Gérez les informations de votre entreprise"
            />
            <DashboardCard
              href={href('/dashboard/mes-ao')}
              icon={FileText}
              title="Mes appels d'offres"
              desc="Gérez vos AOs et consultez les candidatures reçues"
            />
            <DashboardCard
              href={href('/ao/new')}
              icon={ShieldCheck}
              title="Publier un AO"
              desc="Lancez un nouvel appel d'offres"
            />
          </>
        )}

        {(profile.role === 'client' || profile.role === 'prestataire') && (
          <DashboardCard
            href={href('/ao')}
            icon={FileText}
            title="Appels d'offres"
            desc={profile.role === 'prestataire' ? 'Consultez les AO ouverts et postulez' : 'Consultez les appels d\'offres'}
          />
        )}

        {(profile.role === 'admin' || profile.role === 'gestionnaire') && (
          <>
            <DashboardCard
              href={href('/admin')}
              icon={ShieldCheck}
              title="Validation des comptes"
              desc="Examinez les dossiers et validez les prestataires"
              badge="verified"
            />
            <DashboardCard
              href={href('/admin/prestataires/new')}
              icon={User}
              title="Enregistrer un prestataire"
              desc="Créer le profil d'un prestataire manuellement"
            />
            {profile.role === 'admin' && (
              <DashboardCard
                href={href('/admin/comptes')}
                icon={Settings}
                title="Gestion des comptes"
                desc="Gérer les rôles et accès de l'équipe"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold text-dark">{value}</p>
      <p className="text-xs text-soft mt-0.5">{label}</p>
    </div>
  )
}

interface OnboardingStepProps {
  num: number
  title: string
  desc: string
  active?: boolean
  locked?: boolean
  href?: string
  done?: boolean
}

function OnboardingStep({ num, title, desc, active, locked, href, done }: OnboardingStepProps) {
  const content = (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${active ? 'bg-brand-pale hover:bg-brand/10' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
        ${done ? 'bg-verified text-white' : active ? 'bg-brand text-white' : 'bg-surface text-soft border border-border'}`}>
        {done ? <CheckCircle size={14} /> : locked ? <Lock size={12} /> : num}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${active ? 'text-brand' : locked ? 'text-soft' : 'text-dark'}`}>{title}</p>
        <p className="text-xs text-soft mt-0.5">{desc}</p>
      </div>
      {active && <span className="text-xs font-semibold text-brand">Commencer →</span>}
    </div>
  )

  if (href && !locked) return <Link href={href}>{content}</Link>
  return content
}

interface DashboardCardProps {
  href?: string
  icon: React.ElementType
  title: string
  desc: string
  badge?: 'verified' | 'pending'
  unread?: number
  locked?: boolean
}

function DashboardCard({ href, icon: Icon, title, desc, badge, unread, locked }: DashboardCardProps) {
  const content = (
    <div className={`card p-5 flex items-start gap-4 group ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="w-11 h-11 rounded-xl bg-brand-pale flex items-center justify-center flex-shrink-0 group-hover:bg-brand transition-colors">
        {locked
          ? <Lock size={18} className="text-soft" />
          : <Icon size={20} className="text-brand group-hover:text-white transition-colors" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-dark text-sm">{title}</p>
          {badge === 'verified' && <CheckCircle size={13} className="text-verified" />}
          {badge === 'pending' && !locked && <Clock size={13} className="text-amber-500" />}
          {(unread ?? 0) > 0 && (
            <span className="bg-brand text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <p className="text-xs text-soft mt-0.5 leading-relaxed">{desc}</p>
        {locked && <p className="text-xs text-amber-600 mt-1 font-medium">Complétez votre profil d&apos;abord</p>}
      </div>
    </div>
  )

  if (href && !locked) return <Link href={href}>{content}</Link>
  return content
}
