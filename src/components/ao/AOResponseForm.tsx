'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

interface Props {
  aoId: string
  prestataireId: string
  locale: string
  hasApplied: boolean
}

export default function AOResponseForm({ aoId, prestataireId, locale, hasApplied }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(hasApplied)

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle size={20} className="text-verified flex-shrink-0" />
        <div>
          <p className="font-semibold text-dark text-sm">Candidature envoyée !</p>
          <p className="text-xs text-mid mt-0.5">L&apos;entreprise examinera votre candidature.</p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.from('ao_responses').insert({
      ao_id: aoId,
      prestataire_id: prestataireId,
      message: message.trim(),
      proposed_budget: budget ? parseInt(budget.replace(/\D/g, '')) : null,
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h2 className="font-bold text-dark mb-4">Soumettre ma candidature</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Message de candidature *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Décrivez votre expérience, votre approche, vos disponibilités…"
            required
          />
        </div>
        <div>
          <label className="label">Budget proposé (FCFA, optionnel)</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="input"
            placeholder="Ex : 150 000"
          />
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Envoyer ma candidature
        </Button>
      </form>
    </div>
  )
}
