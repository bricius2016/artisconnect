import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EntrepriseProfilForm from '@/components/dashboard/EntrepriseProfilForm'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function EntrepriseProfilPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'entreprise') redirect(`/${locale}/dashboard`)

  const { data: existing } = await supabase
    .from('entreprise_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Profil de l&apos;entreprise</h1>
          <p className="text-sm text-soft mt-0.5">Ces informations apparaissent sur vos appels d&apos;offres</p>
        </div>
      </div>
      <div className="bg-white border border-border rounded-2xl p-6">
        <EntrepriseProfilForm locale={locale} userId={user.id} existing={existing} />
      </div>
    </div>
  )
}
