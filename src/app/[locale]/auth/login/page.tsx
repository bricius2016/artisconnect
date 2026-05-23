import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { redirect } = await searchParams
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
          <h1 className="text-2xl font-bold text-dark">{t('login_title')}</h1>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8">
          <LoginForm locale={locale} redirectTo={redirect} />
          <p className="mt-6 text-center text-sm text-mid">
            {t('no_account')}{' '}
            <Link href={`/${locale}/auth/register`} className="text-brand font-semibold hover:text-brand-dark">
              {t('register_title')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
