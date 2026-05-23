import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AOForm from '@/components/ao/AOForm'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function NewAOPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login?redirect=/${locale}/ao/new`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['entreprise', 'admin'].includes(profile.role)) redirect(`/${locale}/ao`)

  const { data: ep } = await supabase
    .from('entreprise_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ep) redirect(`/${locale}/dashboard/entreprise/profil`)

  const { data: metiers } = await supabase
    .from('metiers')
    .select('id, name_fr, icon, category')
    .eq('is_active', true)
    .order('category')
    .order('name_fr')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/ao`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Publier un appel d&apos;offres</h1>
          <p className="text-sm text-soft mt-0.5">Visible par tous les prestataires vérifiés</p>
        </div>
      </div>
      <div className="bg-white border border-border rounded-2xl p-6">
        <AOForm entrepriseId={ep.id} locale={locale} metiers={metiers ?? []} />
      </div>
    </div>
  )
}
