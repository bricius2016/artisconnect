import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import RealisationsList from '@/components/dashboard/RealisationsList'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function RealisationsPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: pp } = await supabase
    .from('prestataire_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!pp) redirect(`/${locale}/dashboard/profil`)

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('prestataire_id', pp.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark">Mes réalisations</h1>
            <p className="text-sm text-soft mt-0.5">{realisations?.length ?? 0} projet{(realisations?.length ?? 0) > 1 ? 's' : ''} ajouté{(realisations?.length ?? 0) > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <RealisationsList
        prestataireId={pp.id}
        locale={locale}
        initialRealisations={realisations ?? []}
      />
    </div>
  )
}
