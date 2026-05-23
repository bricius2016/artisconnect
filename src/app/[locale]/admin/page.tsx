import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ValidationManager from '@/components/admin/ValidationManager'

interface PageProps {
  params: Promise<{ locale: string }>
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : null
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect(`/${locale}/dashboard`)

  const admin = createAdminClient()
  const { data: rawPrestataires } = await admin
    .from('prestataire_profiles')
    .select(`
      id, business_name, city, account_status,
      rccm_doc_url, id_doc_url, created_at,
      profiles!prestataire_profiles_user_id_fkey(first_name, last_name, phone)
    `)
    .order('created_at', { ascending: false })

  // Generate signed URLs for documents (1h expiry)
  const prestataires = await Promise.all(
    (rawPrestataires ?? []).map(async (p) => {
      const profiles = Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles

      let rccm_doc_signed: string | null = null
      let id_doc_signed: string | null = null

      if (p.rccm_doc_url) {
        const path = extractStoragePath(p.rccm_doc_url, 'documents')
        if (path) {
          const { data } = await admin.storage.from('documents').createSignedUrl(path, 3600)
          rccm_doc_signed = data?.signedUrl ?? null
        }
      }

      if (p.id_doc_url) {
        const path = extractStoragePath(p.id_doc_url, 'documents')
        if (path) {
          const { data } = await admin.storage.from('documents').createSignedUrl(path, 3600)
          id_doc_signed = data?.signedUrl ?? null
        }
      }

      return { ...p, profiles, rccm_doc_signed, id_doc_signed }
    })
  )

  const pending = prestataires.filter(p => p.account_status !== 'verified').length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-dark">Panel Admin</h1>
            <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
          <p className="text-sm text-soft">
            {pending} dossier{pending > 1 ? 's' : ''} en attente · {prestataires.length} prestataire{prestataires.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/admin/prestataires/new`}
            className="text-sm font-medium px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors">
            + Nouveau prestataire
          </Link>
          <Link href={`/${locale}/admin/comptes`}
            className="text-sm font-medium px-4 py-2 bg-white border border-border text-mid rounded-xl hover:border-brand hover:text-brand transition-colors">
            Gérer les comptes
          </Link>
        </div>
      </div>

      <ValidationManager prestataires={prestataires} />
    </div>
  )
}
