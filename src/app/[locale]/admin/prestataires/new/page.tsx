import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreatePrestataireForm from '@/components/admin/CreatePrestataireForm'
import CsvImport from '@/components/admin/CsvImport'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function NewPrestatairePage({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'gestionnaire'].includes(profile.role)) redirect(`/${locale}/dashboard`)

  const { data: metiers } = await supabase
    .from('metiers')
    .select('id, name_fr, slug, icon, category')
    .eq('is_active', true)
    .order('category')
    .order('name_fr')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/admin`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Enregistrer un prestataire</h1>
          <p className="text-sm text-soft mt-0.5">Formulaire manuel ou import CSV en masse</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-8">
        {/* Formulaire */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-bold text-dark mb-5">Création individuelle</h2>
          <CreatePrestataireForm metiers={metiers ?? []} locale={locale} />
        </section>

        {/* Import CSV */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-bold text-dark mb-1">Import CSV en masse</h2>
          <p className="text-sm text-soft mb-5">
            Téléchargez le modèle, remplissez-le et importez plusieurs prestataires d&apos;un coup.
            Chaque prestataire recevra un email pour définir son mot de passe.
          </p>
          <CsvImport metiers={metiers ?? []} />
        </section>
      </div>
    </div>
  )
}
