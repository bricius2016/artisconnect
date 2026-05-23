'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Upload, FileCheck } from 'lucide-react'

interface Metier { id: string; name_fr: string; icon: string; category: string }

const schema = z.object({
  title:       z.string().min(5, 'Minimum 5 caractères'),
  description: z.string().min(20, 'Minimum 20 caractères'),
  metier_id:   z.string().optional(),
  city:        z.enum(['ouagadougou', 'bobo_dioulasso']),
  budget_min:  z.coerce.number().optional(),
  budget_max:  z.coerce.number().optional(),
  deadline:    z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  entrepriseId: string
  locale: string
  metiers: Metier[]
}

export default function AOForm({ entrepriseId, locale, metiers }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [daoFile, setDaoFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { city: 'ouagadougou' },
  })

  const grouped = metiers.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {} as Record<string, Metier[]>)

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    // Upload DAO si fourni
    let dao_url: string | null = null
    if (daoFile) {
      const ext = daoFile.name.split('.').pop()
      const path = `dao/${entrepriseId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('dao')
        .upload(path, daoFile, { upsert: true })
      if (uploadErr) { setServerError('Erreur upload DAO : ' + uploadErr.message); return }
      const { data: urlData } = supabase.storage.from('dao').getPublicUrl(path)
      dao_url = urlData.publicUrl
    }

    const { data: ao, error } = await supabase
      .from('appels_offres')
      .insert({
        entreprise_id: entrepriseId,
        title:         data.title,
        description:   data.description,
        metier_id:     data.metier_id || null,
        city:          data.city,
        budget_min:    data.budget_min || null,
        budget_max:    data.budget_max || null,
        deadline:      data.deadline || null,
        dao_url,
        status:        'open',
      })
      .select('id')
      .single()

    if (error) { setServerError(error.message); return }
    router.push(`/${locale}/ao/${ao.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Description de l&apos;appel d&apos;offres</h2>
        <Input
          label="Titre *"
          placeholder="Ex : Rénovation façade bâtiment administratif"
          error={errors.title?.message}
          {...register('title')}
        />
        <div>
          <label className="label">Description détaillée *</label>
          <textarea
            className="input resize-none"
            rows={5}
            placeholder="Décrivez les travaux, les contraintes, les délais d'exécution, les matériaux souhaités…"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>
        <div>
          <label className="label">Corps de métier recherché</label>
          <select className="input" {...register('metier_id')}>
            <option value="">— Tous les métiers —</option>
            {Object.entries(grouped).map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name_fr}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-dark text-sm border-b border-border pb-2">Conditions</h2>
        <div>
          <label className="label">Ville *</label>
          <select className="input" {...register('city')}>
            <option value="ouagadougou">Ouagadougou</option>
            <option value="bobo_dioulasso">Bobo-Dioulasso</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Budget min (FCFA)" type="number" placeholder="500 000" {...register('budget_min')} />
          <Input label="Budget max (FCFA)" type="number" placeholder="2 000 000" {...register('budget_max')} />
        </div>
        <Input label="Date limite de candidature" type="date" {...register('deadline')} />

        <div>
          <label className="label">Dossier d&apos;appel d&apos;offres (optionnel)</label>
          <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand transition-colors bg-surface">
            {daoFile
              ? <FileCheck size={18} className="text-verified flex-shrink-0" />
              : <Upload size={18} className="text-soft flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark truncate">
                {daoFile ? daoFile.name : 'Charger le dossier DAO'}
              </p>
              <p className="text-xs text-soft">PDF, Word ou ZIP — max 20 Mo</p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.zip"
              className="hidden"
              onChange={e => setDaoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </section>

      {serverError && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{serverError}</p>}

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Publier l&apos;appel d&apos;offres
      </Button>
    </form>
  )
}
