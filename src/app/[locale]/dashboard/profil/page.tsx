import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/dashboard/ProfilForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function ProfilPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, phone')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'prestataire') redirect(`/${locale}/dashboard`)

  const { data: prestataireProfile } = await supabase
    .from('prestataire_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: metiers } = await supabase
    .from('metiers')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name_fr')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/${locale}/dashboard`}
          className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Mon profil professionnel</h1>
          <p className="text-sm text-soft mt-0.5">Ces informations sont visibles par les clients</p>
        </div>
      </div>

      <ProfilForm
        locale={locale}
        userId={user.id}
        profile={profile}
        prestataireProfile={prestataireProfile}
        metiers={metiers ?? []}
      />
    </div>
  )
}
