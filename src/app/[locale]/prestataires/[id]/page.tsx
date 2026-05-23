import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { MapPin, Phone, Globe, Star, Clock, CheckCircle, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/ui/StarRating'
import Avatar from '@/components/ui/Avatar'
import ContactButton from '@/components/prestataire/ContactButton'
import WriteReviewForm from '@/components/prestataire/WriteReviewForm'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('prestataire_profiles')
    .select('business_name, description, city, metiers(name_fr, name_en)')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Prestataire introuvable' }

  const metier = Array.isArray(data.metiers) ? data.metiers[0] : data.metiers
  const metierName = locale === 'fr' ? metier?.name_fr : metier?.name_en
  const city = data.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'

  return {
    title: `${data.business_name} — ${metierName ?? 'Prestataire'} à ${city}`,
    description: data.description ?? `Découvrez le profil de ${data.business_name}, ${metierName} vérifié à ${city} sur ArtisConnect.`,
    openGraph: {
      title: `${data.business_name} | ArtisConnect`,
      description: data.description ?? `${metierName} vérifié à ${city}`,
    },
  }
}

export default async function PrestatairePage({ params }: PageProps) {
  const { locale, id } = await params
  const t = await getTranslations('profile')

  const supabase = await createServerSupabaseClient()

  const { data: prestataire } = await supabase
    .from('prestataire_profiles')
    .select(`
      *,
      metiers(name_fr, name_en, slug, icon, category),
      profiles!prestataire_profiles_user_id_fkey(first_name, last_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!prestataire || prestataire.account_status !== 'verified') notFound()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('prestataire_id', id)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(9)

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`*, profiles!reviews_client_id_fkey(first_name, last_name, avatar_url)`)
    .eq('prestataire_id', id)
    .eq('is_moderated', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Check if current user can write a review
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === prestataire.profiles?.id
  let canReview = false
  let alreadyReviewed = false

  if (user && !isOwner) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('prestataire_id', id)
      .eq('client_id', user.id)
      .maybeSingle()
    alreadyReviewed = !!existing
    canReview = !alreadyReviewed
  }

  const metierName = locale === 'fr' ? prestataire.metiers?.name_fr : prestataire.metiers?.name_en
  const cityLabel = prestataire.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'
  const ownerName = `${prestataire.profiles?.first_name ?? ''} ${prestataire.profiles?.last_name ?? ''}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile header */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Avatar name={prestataire.business_name} src={prestataire.profiles?.avatar_url} size="xl" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-dark">{prestataire.business_name}</h1>
                  <span className="badge-verified text-xs">{t('verified')} ✓</span>
                  {prestataire.subscription_tier === 'premium' && (
                    <span className="badge-premium text-xs">{t('premium')}</span>
                  )}
                </div>
                <p className="text-sm text-mid mb-2">
                  {prestataire.metiers?.icon} {metierName}
                  {prestataire.years_experience && (
                    <span className="ml-2 text-soft">· {t('experience', { years: prestataire.years_experience })}</span>
                  )}
                </p>
                <StarRating rating={prestataire.avg_rating} count={prestataire.total_reviews} size="md" />
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-mid">
                  <span className="flex items-center gap-1.5"><MapPin size={13} />{prestataire.neighborhood ? `${prestataire.neighborhood}, ` : ''}{cityLabel}</span>
                  {prestataire.website && (
                    <a href={prestataire.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-brand">
                      <Globe size={13} />{prestataire.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {prestataire.description && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-bold text-dark mb-3">{t('about')}</h2>
              <p className="text-sm text-mid leading-relaxed">
                {locale === 'fr' ? prestataire.description : (prestataire.description_en || prestataire.description)}
              </p>
            </div>
          )}

          {/* Réalisations */}
          {realisations && realisations.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-bold text-dark mb-4">{t('portfolio')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {realisations.map((r) => (
                  <div key={r.id} className="group">
                    {r.image_urls?.[0] ? (
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface">
                        <Image
                          src={r.image_urls[0]}
                          alt={r.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-xl bg-surface flex items-center justify-center text-3xl">
                        {prestataire.metiers?.icon}
                      </div>
                    )}
                    <p className="text-xs font-medium text-dark mt-1.5 truncate">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avis */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-dark">
                Avis <span className="text-soft font-normal">({prestataire.total_reviews})</span>
              </h2>
              <StarRating rating={prestataire.avg_rating} size="md" />
            </div>

            {reviews && reviews.length > 0 ? (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-5 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={`${review.profiles?.first_name} ${review.profiles?.last_name}`}
                        src={review.profiles?.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-dark">
                            {review.profiles?.first_name} {review.profiles?.last_name}
                          </p>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-mid mt-1 leading-relaxed">{review.comment}</p>
                        )}
                        {review.response && (
                          <div className="mt-2 pl-3 border-l-2 border-brand">
                            <p className="text-xs text-brand font-semibold mb-0.5">Réponse du prestataire</p>
                            <p className="text-xs text-mid">{review.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-soft text-center py-6">Pas encore d&apos;avis.</p>
            )}

            {/* Review form */}
            {!user && (
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-soft">
                  <Link href={`/${locale}/auth/login`} className="text-brand font-semibold hover:text-brand-dark">
                    Connectez-vous
                  </Link>{' '}
                  pour laisser un avis.
                </p>
              </div>
            )}
            {canReview && <WriteReviewForm prestataireId={id} locale={locale} />}
            {alreadyReviewed && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-soft text-center">Vous avez déjà laissé un avis sur ce profil.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar contact */}
        <aside className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-24">
            <h3 className="font-bold text-dark mb-4">Contacter</h3>

            {prestataire.hourly_rate_min && (
              <div className="mb-4 p-3 bg-surface rounded-xl">
                <p className="text-xs text-soft">{t('rate')}</p>
                <p className="font-bold text-dark">
                  {prestataire.hourly_rate_min.toLocaleString('fr-FR')}{' '}
                  {prestataire.hourly_rate_max ? `– ${prestataire.hourly_rate_max.toLocaleString('fr-FR')}` : '+'}{' '}
                  <span className="text-soft font-normal text-sm">{t('fcfa')}{t('per_hour')}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              {prestataire.phone_public && (
                <a
                  href={`tel:${prestataire.phone_public}`}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-dark text-white rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors"
                >
                  <Phone size={16} />
                  {prestataire.phone_public}
                </a>
              )}

              {prestataire.whatsapp && (
                <a
                  href={`https://wa.me/${prestataire.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}

              <ContactButton
                prestataireId={prestataire.id}
                locale={locale}
                label={t('send_message')}
              />
            </div>
          </div>

          {/* Infos vérification */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={15} className="text-verified" />
              <span className="text-sm font-semibold text-dark">Profil vérifié</span>
            </div>
            <ul className="space-y-1.5">
              {prestataire.rccm_number && (
                <li className="text-xs text-mid">✓ RCCM validé</li>
              )}
              <li className="text-xs text-mid">✓ Identité vérifiée</li>
              <li className="text-xs text-mid">✓ Visite physique effectuée</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

