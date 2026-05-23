import Link from 'next/link'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function ForgotPasswordPage({ params }: PageProps) {
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
          <h1 className="text-2xl font-bold text-dark">Mot de passe oublié</h1>
          <p className="text-sm text-soft mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8">
          <ForgotPasswordForm locale={locale} />
          <p className="mt-6 text-center text-sm text-mid">
            <Link href={`/${locale}/auth/login`} className="text-brand font-semibold hover:text-brand-dark">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
