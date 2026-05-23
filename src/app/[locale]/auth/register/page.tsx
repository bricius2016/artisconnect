import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ role?: string }>
}

export default async function RegisterPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { role } = await searchParams
  const t = await getTranslations('auth')

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
          <h1 className="text-2xl font-bold text-dark">{t('register_title')}</h1>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8">
          <RegisterForm locale={locale} defaultRole={(role as 'client' | 'prestataire' | 'entreprise') ?? 'client'} />
          <p className="mt-6 text-center text-sm text-mid">
            {t('already_account')}{' '}
            <Link href={`/${locale}/auth/login`} className="text-brand font-semibold hover:text-brand-dark">
              {t('login_title')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
