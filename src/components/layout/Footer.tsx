import Link from 'next/link'

interface FooterProps {
  locale: string
}

export default function Footer({ locale }: FooterProps) {
  const href = (path: string) => `/${locale}${path}`
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-xs">AC</span>
              </span>
              <span className="font-bold text-dark">ArtisConnect</span>
            </div>
            <p className="text-sm text-soft leading-relaxed">
              La plateforme qui connecte artisans et clients au Burkina Faso.
            </p>
            <p className="mt-3 text-xs text-soft">Ouagadougou · Bobo-Dioulasso</p>
          </div>

          <div>
            <p className="text-xs font-bold text-dark uppercase tracking-wide mb-3">Trouver</p>
            <ul className="space-y-2">
              <li><Link href={href('/search')} className="text-sm text-mid hover:text-brand">Prestataires</Link></li>
              <li><Link href={href('/ao')} className="text-sm text-mid hover:text-brand">Appels d&apos;offres</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-dark uppercase tracking-wide mb-3">Prestataires</p>
            <ul className="space-y-2">
              <li><Link href={href('/auth/register?role=prestataire')} className="text-sm text-mid hover:text-brand">Inscrire mon atelier</Link></li>
              <li><Link href={href('/dashboard')} className="text-sm text-mid hover:text-brand">Espace pro</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-dark uppercase tracking-wide mb-3">Compte</p>
            <ul className="space-y-2">
              <li><Link href={href('/auth/login')} className="text-sm text-mid hover:text-brand">Se connecter</Link></li>
              <li><Link href={href('/auth/register')} className="text-sm text-mid hover:text-brand">S&apos;inscrire</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-soft">© {year} ArtisConnect. Tous droits réservés.</p>
          <div className="flex gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface text-soft border border-border">
              🇧🇫 Burkina Faso
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface text-soft border border-border">
              FCFA
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
