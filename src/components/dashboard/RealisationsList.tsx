'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Plus, Trash2, Star, Upload, X } from 'lucide-react'

interface Realisation {
  id: string
  title: string
  description: string | null
  image_urls: string[]
  is_featured: boolean
  created_at: string
}

interface Props {
  prestataireId: string
  locale: string
  initialRealisations: Realisation[]
}

export default function RealisationsList({ prestataireId, locale, initialRealisations }: Props) {
  const router = useRouter()
  const [realisations, setRealisations] = useState(initialRealisations)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('realisations').delete().eq('id', id)
    setRealisations(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('realisations').update({ is_featured: !current }).eq('id', id)
    setRealisations(prev => prev.map(r => r.id === id ? { ...r, is_featured: !current } : r))
  }

  function onAdded(r: Realisation) {
    setRealisations(prev => [r, ...prev])
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-mid hover:border-brand hover:text-brand transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Ajouter une réalisation
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <RealisationForm
          prestataireId={prestataireId}
          onAdded={onAdded}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* List */}
      {realisations.length === 0 && !showForm && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📷</div>
          <p className="font-semibold text-dark">Aucune réalisation</p>
          <p className="text-sm text-soft mt-1">Ajoutez des photos de vos travaux pour convaincre les clients.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {realisations.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded-2xl overflow-hidden group">
            {r.image_urls?.[0] ? (
              <div className="relative aspect-video bg-surface">
                <Image src={r.image_urls[0]} alt={r.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-surface flex items-center justify-center text-4xl">📷</div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-dark text-sm">{r.title}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(r.id, r.is_featured)}
                    title={r.is_featured ? 'Retirer des favoris' : 'Mettre en avant'}
                    className={`p-1.5 rounded-lg transition-colors ${r.is_featured ? 'text-amber-400 bg-amber-50' : 'text-soft hover:text-amber-400 hover:bg-amber-50'}`}
                  >
                    <Star size={14} fill={r.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="p-1.5 rounded-lg text-soft hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {r.description && <p className="text-xs text-soft mt-1 line-clamp-2">{r.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface FormProps {
  prestataireId: string
  onAdded: (r: Realisation) => void
  onCancel: () => void
}

function RealisationForm({ prestataireId, onAdded, onCancel }: FormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    let imageUrls: string[] = []

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `realisations/${prestataireId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('realisations')
        .upload(path, imageFile, { upsert: true })

      if (uploadErr) {
        setError('Erreur upload image : ' + uploadErr.message)
        setLoading(false)
        return
      }
      const { data } = supabase.storage.from('realisations').getPublicUrl(path)
      imageUrls = [data.publicUrl]
    }

    const { data, error: insertErr } = await supabase
      .from('realisations')
      .insert({
        prestataire_id: prestataireId,
        title: title.trim(),
        description: description.trim() || null,
        image_urls: imageUrls,
      })
      .select()
      .single()

    if (insertErr) {
      setError(insertErr.message)
    } else if (data) {
      onAdded(data as Realisation)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-brand rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-dark">Nouvelle réalisation</h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-surface rounded-lg text-soft hover:text-dark">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Titre *</label>
          <input
            className="input"
            placeholder="Ex : Pose de carrelage villa Pissy"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Description (optionnel)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Décrivez brièvement ce travail…"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Photo (optionnel)</label>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand transition-colors bg-surface">
            <Upload size={16} className="text-soft flex-shrink-0" />
            <span className="text-sm text-mid">{imageFile ? imageFile.name : 'Choisir une image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          {preview && (
            <div className="relative mt-2 aspect-video rounded-xl overflow-hidden bg-surface">
              <Image src={preview} alt="preview" fill className="object-cover" />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" loading={loading} disabled={!title.trim()} className="flex-1">
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  )
}
