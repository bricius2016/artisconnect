import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ComptesManager from '@/components/admin/ComptesManager'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function ComptesPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect(`/${locale}/dashboard`)

  // Utiliser le client admin pour contourner RLS et voir tous les comptes
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, first_name, last_name, phone, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/admin`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Gestion des comptes</h1>
          <p className="text-sm text-soft mt-0.5">Modifier les rôles et accès de tous les utilisateurs</p>
        </div>
      </div>

      <ComptesManager profiles={profiles ?? []} />
    </div>
  )
}
