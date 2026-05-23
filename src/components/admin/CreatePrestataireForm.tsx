'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CheckCircle, Upload } from 'lucide-react'

interface Metier { id: string; name_fr: string; icon: string; category: string }

const schema = z.object({
  email:            z.string().email('Email invalide'),
  first_name:       z.string().min(1, 'Obligatoire'),
  last_name:        z.string().min(1, 'Obligatoire'),
  phone:            z.string().optional(),
  business_name:    z.string().min(1, 'Obligatoire'),
  metier_id:        z.string().min(1, 'Choisissez un métier'),
  city:             z.enum(['ouagadougou', 'bobo_dioulasso'], { errorMap: () => ({ message: 'Choisissez une ville' }) }),
  neighborhood:     z.string().optional(),
  description:      z.string().optional(),
  phone_public:     z.string().optional(),
  hourly_rate_min:  z.coerce.number().optional(),
  hourly_rate_max:  z.coerce.number().optional(),
  years_experience: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  metiers: Metier[]
  locale: string
}

export default function CreatePrestataireForm({ metiers, locale }: Props) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const grouped = metiers.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {} as Record<string, Metier[]>)

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/admin/create-prestataire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setServerError(json.error); return }
    setSuccess(true)
    reset()
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-verified" />
        </div>
        <div>
          <p className="font-bold text-dark">Prestataire créé !</p>
          <p className="text-sm text-soft mt-1">Un email a été envoyé pour qu&apos;il définisse son mot de passe.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setSuccess(false)}>Ajouter un autre</Button>
          <Button variant="secondary" onClick={() => router.push(`/${locale}/admin`)}>Retour à l&apos;admin</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identité */}
      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Identité du propriétaire</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom *" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Nom *" error={errors.last_name?.message} {...register('last_name')} />
        </div>
        <Input label="Email *" type="email" placeholder="prestataire@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="Téléphone" placeholder="+226 XX XX XX XX" error={errors.phone?.message} {...register('phone')} />
      </section>

      {/* Atelier */}
      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Informations de l&apos;atelier</h2>
        <Input label="Nom de l'atelier *" placeholder="Ex : Atelier Koné Menuiserie" error={errors.business_name?.message} {...register('business_name')} />

        <div>
          <label className="label">Métier *</label>
          <select className="input" {...register('metier_id')}>
            <option value="">— Choisir un métier —</option>
            {Object.entries(grouped).map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name_fr}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.metier_id && <p className="text-xs text-red-500 mt-1">{errors.metier_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ville *</label>
            <select className="input" {...register('city')}>
              <option value="">— Choisir —</option>
              <option value="ouagadougou">Ouagadougou</option>
              <option value="bobo_dioulasso">Bobo-Dioulasso</option>
            </select>
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
          </div>
          <Input label="Quartier" placeholder="Ex : Pissy, Gounghin…" error={errors.neighborhood?.message} {...register('neighborhood')} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Présentation de l'atelier…" {...register('description')} />
        </div>
      </section>

      {/* Tarifs & expérience */}
      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Tarifs & expérience (optionnel)</h2>
        <Input label="Téléphone public" placeholder="Numéro affiché sur le profil" {...register('phone_public')} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Tarif min (FCFA/h)" type="number" placeholder="5000" {...register('hourly_rate_min')} />
          <Input label="Tarif max (FCFA/h)" type="number" placeholder="15000" {...register('hourly_rate_max')} />
          <Input label="Années d'exp." type="number" placeholder="5" {...register('years_experience')} />
        </div>
      </section>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{serverError}</p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Créer le prestataire
      </Button>
    </form>
  )
}
