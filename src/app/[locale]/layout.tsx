import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import '../../styles/globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: "ArtisConnect — Trouvez l'artisan qu'il vous faut",
    template: '%s | ArtisConnect',
  },
  description: 'Plateforme de mise en relation entre clients et artisans vérifiés au Burkina Faso. Plombiers, menuisiers, électriciens, maçons à Ouagadougou et Bobo-Dioulasso.',
  keywords: ['artisan', 'prestataire', 'Burkina Faso', 'Ouagadougou', 'plombier', 'menuisier', 'électricien', 'maçon', 'ArtisConnect'],
  authors: [{ name: 'ArtisConnect' }],
  openGraph: {
    siteName: 'ArtisConnect',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html lang={locale} className={jakarta.variable}>
      <body className="bg-surface text-dark antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale} user={user} profile={profile} />
          <main className="min-h-screen">{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
