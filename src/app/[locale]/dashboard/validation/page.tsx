import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import ValidationUpload from '@/components/dashboard/ValidationUpload'

interface PageProps {
  params: Promise<{ locale: string }>
}

const STATUS_STEPS: Record<string, number> = {
  pending: 0,
  step1_done: 1,
  step2_done: 2,
  verified: 3,
  rejected: -1,
  suspended: -1,
}

export default async function ValidationPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('validation')
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: pp } = await supabase
    .from('prestataire_profiles')
    .select('id, account_status, rccm_doc_url, id_doc_url, business_name')
    .eq('user_id', user.id)
    .single()

  if (!pp) redirect(`/${locale}/dashboard/profil`)

  const currentStep = STATUS_STEPS[pp.account_status] ?? 0
  const isVerified = pp.account_status === 'verified'
  const isRejected = pp.account_status === 'rejected'

  const steps = [
    {
      num: 1,
      title: t('step1_title'),
      desc: t('step1_desc'),
      done: currentStep >= 1,
      active: currentStep === 0,
    },
    {
      num: 2,
      title: t('step2_title'),
      desc: t('step2_desc'),
      done: currentStep >= 2,
      active: currentStep === 1,
    },
    {
      num: 3,
      title: t('step3_title'),
      desc: t('step3_desc'),
      done: currentStep >= 3,
      active: currentStep === 2,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/dashboard`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Vérification du compte</h1>
          <p className="text-sm text-soft mt-0.5">Faites vérifier votre atelier pour apparaître dans la recherche</p>
        </div>
      </div>

      {/* Status banner */}
      {isVerified && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CheckCircle size={20} className="text-verified flex-shrink-0" />
          <div>
            <p className="font-semibold text-dark text-sm">Compte vérifié ✓</p>
            <p className="text-xs text-mid">Votre profil est visible par tous les clients.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-dark text-sm">Dossier refusé</p>
            <p className="text-xs text-mid">Contactez le support pour plus d&apos;informations.</p>
          </div>
        </div>
      )}

      {/* Progress steps */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-6">
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.num} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                  ${step.done ? 'bg-verified text-white' : step.active ? 'bg-brand text-white' : 'bg-surface text-soft border border-border'}`}>
                  {step.done ? <CheckCircle size={16} /> : step.active ? <Clock size={16} /> : step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${step.done ? 'bg-verified' : 'bg-border'}`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-sm font-semibold ${step.active ? 'text-brand' : step.done ? 'text-dark' : 'text-soft'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-soft mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload form — only if step 0 (pending) */}
      {currentStep === 0 && (
        <ValidationUpload
          prestataireId={pp.id}
          locale={locale}
          existingRccm={pp.rccm_doc_url}
          existingId={pp.id_doc_url}
        />
      )}

      {currentStep === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-dark text-sm">Documents reçus — vérification en cours</p>
            <p className="text-xs text-amber-700 mt-1">
              Notre équipe examine vos documents. Vous serez notifié sous 48h.
            </p>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <FileText size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-dark text-sm">Vérification physique programmée</p>
            <p className="text-xs text-blue-700 mt-1">
              Un agent visitera votre atelier dans les 3 à 7 jours. Assurez-vous d&apos;être disponible.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
