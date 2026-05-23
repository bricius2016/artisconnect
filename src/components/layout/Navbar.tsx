'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, X, Search, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase'

interface NavbarProps {
  locale: string
  user?: { id: string; email?: string } | null
  profile?: { first_name: string; last_name: string; role: string } | null
}

export default function Navbar({ locale, user, profile }: NavbarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const href = (path: string) => `/${locale}${path}`

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(href('/'))
    router.refresh()
  }

  const navLinks = [
    { label: t('search'), href: href('/search') },
    { label: t('ao'), href: href('/ao') },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={href('/')} className="flex items-center gap-2 flex-shrink-0">
          <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">AC</span>
          </span>
          <span className="font-bold text-dark text-base hidden sm:block">ArtisConnect</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-brand bg-brand-pale'
                  : 'text-mid hover:text-dark hover:bg-surface'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search icon on mobile */}
          <Link href={href('/search')} className="md:hidden p-2 text-mid hover:text-dark">
            <Search size={20} />
          </Link>

          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-brand transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-brand-light text-brand-dark font-bold text-xs flex items-center justify-center">
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
                <span className="hidden sm:block text-sm font-medium text-dark">
                  {profile.first_name}
                </span>
                <ChevronDown size={14} className="text-soft" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-2xl shadow-lg py-1 z-50">
                  <Link
                    href={href('/dashboard')}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark hover:bg-surface"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={15} className="text-soft" />
                    {t('dashboard')}
                  </Link>
                  {profile.role === 'prestataire' && (
                    <Link
                      href={href('/dashboard/profil')}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark hover:bg-surface"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={15} className="text-soft" />
                      Mon profil
                    </Link>
                  )}
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={href('/auth/login')} className="btn-secondary text-sm px-4 py-2 hidden sm:inline-flex">
                {t('login')}
              </Link>
              <Link href={href('/auth/register')} className="btn-primary text-sm px-4 py-2">
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-mid hover:text-dark"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-mid hover:text-dark hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={href('/auth/register?role=prestataire')}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-brand"
            >
              {t('register_pro')}
            </Link>
            {!user && (
              <Link
                href={href('/auth/login')}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-mid hover:text-dark hover:bg-surface"
              >
                {t('login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
