import Link from 'next/link'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { locale } = await params

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={`/${locale}/`} className="inline-flex items-center gap-2 mb-6">
            <span className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </span>
            <span className="font-bold text-dark text-lg">ArtisConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-dark">Nouveau mot de passe</h1>
          <p className="text-sm text-soft mt-2">Choisissez un mot de passe sécurisé.</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8">
          <ResetPasswordForm locale={locale} />
        </div>
      </div>
    </div>
  )
}
