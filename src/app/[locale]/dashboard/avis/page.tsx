import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
import ReviewsManager from '@/components/dashboard/ReviewsManager'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AvisPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: pp } = await supabase
    .from('prestataire_profiles')
    .select('id, avg_rating, total_reviews')
    .eq('user_id', user.id)
    .single()

  if (!pp) redirect(`/${locale}/dashboard/profil`)

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, response, created_at,
      profiles!reviews_client_id_fkey(first_name, last_name, avatar_url)
    `)
    .eq('prestataire_id', pp.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Mes avis</h1>
          <p className="text-sm text-soft mt-0.5">{pp.total_reviews} avis au total</p>
        </div>
      </div>

      {/* Summary */}
      {pp.total_reviews > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5 mb-6 flex items-center gap-5">
          <div className="text-center">
            <p className="text-4xl font-bold text-dark">{Number(pp.avg_rating).toFixed(1)}</p>
            <p className="text-xs text-soft mt-0.5">sur 5</p>
          </div>
          <div className="flex-1">
            <StarRating rating={pp.avg_rating} size="md" />
            <p className="text-sm text-mid mt-1">Basé sur {pp.total_reviews} avis</p>
          </div>
        </div>
      )}

      <ReviewsManager reviews={(reviews ?? []).map(r => ({
        ...r,
        profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
      }))} />
    </div>
  )
}
