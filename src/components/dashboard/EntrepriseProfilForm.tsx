'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  company_name: z.string().min(2, 'Obligatoire'),
  sector:       z.string().optional(),
  city:         z.enum(['ouagadougou', 'bobo_dioulasso'], { errorMap: () => ({ message: 'Choisissez une ville' }) }),
  address:      z.string().optional(),
  phone_public: z.string().optional(),
  website:      z.string().optional(),
  description:  z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  locale: string
  userId: string
  existing: Partial<FormData & { id: string }> | null
}

export default function EntrepriseProfilForm({ locale, userId, existing }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: existing?.company_name ?? '',
      sector:       existing?.sector ?? '',
      city:         existing?.city ?? 'ouagadougou',
      address:      existing?.address ?? '',
      phone_public: existing?.phone_public ?? '',
      website:      existing?.website ?? '',
      description:  existing?.description ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.from('entreprise_profiles').upsert(
      { user_id: userId, ...data },
      { onConflict: 'user_id' }
    )
    if (error) { setServerError(error.message); return }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Informations de l&apos;entreprise</h2>
        <Input label="Nom de l'entreprise / institution *" error={errors.company_name?.message} {...register('company_name')} />
        <Input label="Secteur d'activité" placeholder="Ex : BTP, Industrie, Services…" {...register('sector')} />
        <div>
          <label className="label">Ville *</label>
          <select className="input" {...register('city')}>
            <option value="ouagadougou">Ouagadougou</option>
            <option value="bobo_dioulasso">Bobo-Dioulasso</option>
          </select>
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
        </div>
        <Input label="Adresse" placeholder="Ex : Secteur 4, Rue 12.34" {...register('address')} />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Contact public</h2>
        <Input label="Téléphone" placeholder="+226 XX XX XX XX" {...register('phone_public')} />
        <Input label="Site web" placeholder="https://exemple.com" {...register('website')} />
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Présentez votre entreprise…" {...register('description')} />
        </div>
      </section>

      {serverError && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{serverError}</p>}

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        {saved ? '✓ Enregistré' : 'Enregistrer le profil'}
      </Button>
    </form>
  )
}
