// ============================================================
// ArtisConnect — Internationalisation (FR / EN)
// Compatible next-intl v4
// ============================================================

import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]
