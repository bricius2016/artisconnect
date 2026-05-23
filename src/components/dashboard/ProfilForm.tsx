'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'
import type { Metier } from '@/types'

const schema = z.object({
  business_name: z.string().min(2, 'Requis'),
  description: z.string().min(20, 'Minimum 20 caractères').max(1000),
  metier_id: z.string().min(1, 'Choisissez un métier'),
  city: z.enum(['ouagadougou', 'bobo_dioulasso']),
  neighborhood: z.string().optional(),
  phone_public: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  years_experience: z.coerce.number().min(0).max(60).optional(),
  hourly_rate_min: z.coerce.number().min(0).optional(),
  hourly_rate_max: z.coerce.number().min(0).optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  locale: string
  userId: string
  profile: { first_name: string; last_name: string; phone: string | null }
  prestataireProfile: Record<string, unknown> | null
  metiers: Metier[]
}

const CATEGORIES: Record<string, string> = {
  batiment: '🏗️ Bâtiment & construction',
  mecanique: '🔧 Automobile & mécanique',
  textile: '🪡 Textile & couture',
  beaute: '💇 Beauté & bien-être',
  services: '🏠 Services à domicile',
  tech: '💻 Numérique & tech',
  alimentation: '🍽️ Alimentation',
  artisanat: '🏺 Artisanat',
  general: '📦 Autre',
}

export default function ProfilForm({ locale, userId, profile, prestataireProfile, metiers }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const pp = prestataireProfile as {
    business_name?: string; description?: string; metier_id?: string
    city?: string; neighborhood?: string; phone_public?: string; whatsapp?: string
    website?: string; years_experience?: number; hourly_rate_min?: number; hourly_rate_max?: number
  } | null

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? '',
      business_name: pp?.business_name ?? '',
      description: pp?.description ?? '',
      metier_id: pp?.metier_id ?? '',
      city: (pp?.city as 'ouagadougou' | 'bobo_dioulasso') ?? 'ouagadougou',
      neighborhood: pp?.neighborhood ?? '',
      phone_public: pp?.phone_public ?? '',
      whatsapp: pp?.whatsapp ?? '',
      website: pp?.website ?? '',
      years_experience: pp?.years_experience ?? undefined,
      hourly_rate_min: pp?.hourly_rate_min ?? undefined,
      hourly_rate_max: pp?.hourly_rate_max ?? undefined,
    },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    // Update profile (first_name, last_name, phone)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || null })
      .eq('id', userId)

    if (profileError) { setServerError(profileError.message); return }

    // Upsert prestataire profile
    const ppData = {
      user_id: userId,
      business_name: data.business_name,
      description: data.description,
      metier_id: data.metier_id,
      city: data.city,
      neighborhood: data.neighborhood || null,
      phone_public: data.phone_public || null,
      whatsapp: data.whatsapp || null,
      website: data.website || null,
      years_experience: data.years_experience ?? null,
      hourly_rate_min: data.hourly_rate_min ?? null,
      hourly_rate_max: data.hourly_rate_max ?? null,
    }

    const { error: ppError } = await supabase
      .from('prestataire_profiles')
      .upsert(ppData, { onConflict: 'user_id' })

    if (ppError) { setServerError(ppError.message); return }

    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  // Group metiers by category
  const grouped = metiers.reduce<Record<string, Metier[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identité */}
      <section className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-dark text-sm uppercase tracking-wide">Identité</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Nom" error={errors.last_name?.message} {...register('last_name')} />
        </div>
        <Input label="Téléphone personnel" placeholder="+226 XX XX XX XX" {...register('phone')} />
      </section>

      {/* Atelier */}
      <section className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-dark text-sm uppercase tracking-wide">Votre atelier</h2>

        <Input
          label="Nom de l'atelier / entreprise *"
          placeholder="Ex : Plomberie Express Ouaga"
          error={errors.business_name?.message}
          {...register('business_name')}
        />

        <div>
          <label className="label">Métier *</label>
          <select className="input" {...register('metier_id')}>
            <option value="">— Choisissez votre métier —</option>
            {Object.entries(grouped).map(([cat, items]) => (
              <optgroup key={cat} label={CATEGORIES[cat] ?? cat}>
                {items.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name_fr}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.metier_id && <p className="mt-1 text-xs text-red-500">{errors.metier_id.message}</p>}
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Décrivez vos services, votre expérience, ce qui vous distingue…"
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>
      </section>

      {/* Localisation */}
      <section className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-dark text-sm uppercase tracking-wide">Localisation</h2>
        <div>
          <label className="label">Ville *</label>
          <select className="input" {...register('city')}>
            <option value="ouagadougou">Ouagadougou</option>
            <option value="bobo_dioulasso">Bobo-Dioulasso</option>
          </select>
        </div>
        <Input
          label="Quartier"
          placeholder="Ex : Gounghin, Pissy, Koulouba…"
          {...register('neighborhood')}
        />
      </section>

      {/* Contact */}
      <section className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-dark text-sm uppercase tracking-wide">Contact public</h2>
        <Input
          label="Téléphone (visible sur votre profil)"
          placeholder="+226 70 XX XX XX"
          {...register('phone_public')}
        />
        <Input
          label="WhatsApp"
          placeholder="+226 70 XX XX XX"
          {...register('whatsapp')}
        />
        <Input
          label="Site web"
          placeholder="https://monsite.com"
          error={errors.website?.message}
          {...register('website')}
        />
      </section>

      {/* Tarifs & expérience */}
      <section className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-dark text-sm uppercase tracking-wide">Tarifs & expérience</h2>
        <Input
          label="Années d'expérience"
          type="number"
          min={0}
          max={60}
          placeholder="Ex : 8"
          error={errors.years_experience?.message}
          {...register('years_experience')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tarif min (FCFA/heure)"
            type="number"
            min={0}
            placeholder="Ex : 15000"
            {...register('hourly_rate_min')}
          />
          <Input
            label="Tarif max (FCFA/heure)"
            type="number"
            min={0}
            placeholder="Ex : 50000"
            {...register('hourly_rate_max')}
          />
        </div>
      </section>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{serverError}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-verified bg-green-50 px-4 py-3 rounded-xl">
          <CheckCircle size={16} />
          Profil enregistré avec succès !
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Enregistrer mon profil
      </Button>
    </form>
  )
}
