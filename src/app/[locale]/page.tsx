import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Search, CheckCircle, Star, Zap } from 'lucide-react'
import type { Metier, PrestataireCard as PrestataireCardType } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "ArtisConnect — Trouvez l'artisan qu'il vous faut au Burkina Faso",
  description: "Trouvez des artisans et prestataires vérifiés à Ouagadougou et Bobo-Dioulasso. Plombiers, menuisiers, électriciens, maçons et bien plus.",
  openGraph: {
    title: "ArtisConnect — Trouvez l'artisan qu'il vous faut",
    description: "Des centaines de professionnels vérifiés accessibles en quelques secondes au Burkina Faso.",
    type: 'website',
  },
}
import PrestataireCard from '@/components/search/PrestataireCard'
import HeroSearch from '@/components/search/HeroSearch'
import { toCard, type RawPrestataire } from '@/lib/mappers'

interface PageProps {
  params: Promise<{ locale: string }>
}

const METIER_CATEGORIES = [
  { key: 'batiment', label_fr: 'Bâtiment', label_en: 'Construction', icon: '🏗️' },
  { key: 'mecanique', label_fr: 'Automobile', label_en: 'Automotive', icon: '🔧' },
  { key: 'textile', label_fr: 'Textile', label_en: 'Textile', icon: '🪡' },
  { key: 'beaute', label_fr: 'Beauté', label_en: 'Beauty', icon: '💇' },
  { key: 'services', label_fr: 'Services à domicile', label_en: 'Home services', icon: '🏠' },
  { key: 'tech', label_fr: 'Numérique', label_en: 'Digital', icon: '💻' },
  { key: 'alimentation', label_fr: 'Alimentation', label_en: 'Food', icon: '🍽️' },
  { key: 'artisanat', label_fr: 'Artisanat', label_en: 'Crafts', icon: '🏺' },
]

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('home')
  const tCommon = await getTranslations('common')

  const supabase = await createServerSupabaseClient()

  const [{ data: metiers }, { data: featured }] = await Promise.all([
    supabase.from('metiers').select('*').eq('is_active', true).order('prestataires_count', { ascending: false }).limit(8),
    supabase
      .from('prestataire_profiles')
      .select(`
        id, business_name, user_id, city, neighborhood,
        avg_rating, total_reviews, subscription_tier, is_featured,
        account_status, phone_public, whatsapp,
        metiers!inner(name_fr, name_en, slug, icon)
      `)
      .eq('account_status', 'verified')
      .eq('is_featured', true)
      .order('avg_rating', { ascending: false })
      .limit(6),
  ])

  const href = (path: string) => `/${locale}${path}`

  return (
    <>
      {/* Hero */}
      <section className="relative bg-dark overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #D4460F 0%, transparent 60%), radial-gradient(circle at 80% 20%, #F5EDE9 0%, transparent 50%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <span className="inline-block bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6">
            {t('hero_badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {t('hero_title')}{' '}
            <span className="text-brand italic font-display">{t('hero_title_em')}</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
            {t('hero_subtitle')}
          </p>
          <HeroSearch locale={locale} placeholder={t('search_placeholder')} btnLabel={t('search_btn')} />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-verified" /> Prestataires vérifiés</span>
            <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> Avis authentiques</span>
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-brand" /> Contact instantané</span>
          </div>
        </div>
      </section>

      {/* Métiers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark">{t('browse_metiers')}</h2>
          </div>
          <Link href={href('/search')} className="text-sm font-semibold text-brand hover:text-brand-dark">
            {t('see_all')}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {METIER_CATEGORIES.map((cat) => {
            const metierCount = (metiers as Metier[] | null)?.filter(m => m.category === cat.key).length ?? 0
            return (
              <Link
                key={cat.key}
                href={href(`/search?category=${cat.key}`)}
                className="group flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-2xl hover:border-brand hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold text-dark text-center leading-tight">
                  {locale === 'fr' ? cat.label_fr : cat.label_en}
                </span>
                {metierCount > 0 && (
                  <span className="text-xs text-soft">{metierCount} métier{metierCount > 1 ? 's' : ''}</span>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured prestataires */}
      {featured && featured.length > 0 && (
        <section className="bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-bold text-dark">{t('featured')}</h2>
              <Link href={href('/search?sort_by=featured')} className="text-sm font-semibold text-brand hover:text-brand-dark">
                Voir tous →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(featured as RawPrestataire[]).map((p) => (
                <PrestataireCard key={p.id} prestataire={toCard(p)} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl font-bold text-dark text-center mb-12">{t('how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: '🔍', title: 'Cherchez', desc: 'Tapez votre besoin (plombier, maçon…) et choisissez votre ville.' },
            { step: '02', icon: '⭐', title: 'Comparez', desc: 'Consultez les profils vérifiés, les avis et les réalisations.' },
            { step: '03', icon: '📱', title: 'Contactez', desc: 'Appelez, envoyez un message ou contactez via WhatsApp.' },
          ].map((step) => (
            <div key={step.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-pale mx-auto mb-4 flex items-center justify-center text-3xl">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-brand mb-1 tracking-widest uppercase">{step.step}</div>
              <h3 className="text-lg font-bold text-dark mb-2">{step.title}</h3>
              <p className="text-sm text-mid leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Prestataire */}
      <section className="mx-4 sm:mx-6 mb-16 max-w-7xl lg:mx-auto">
        <div className="bg-dark rounded-3xl px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('cta_pro_title')}</h2>
            <p className="text-white/60 max-w-md">{t('cta_pro_sub')}</p>
          </div>
          <Link
            href={href('/auth/register?role=prestataire')}
            className="flex-shrink-0 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap"
          >
            {t('cta_pro_btn')}
          </Link>
        </div>
      </section>
    </>
  )
}
