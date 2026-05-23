'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Star, CheckCircle } from 'lucide-react'

interface Props {
  prestataireId: string
  locale: string
}

export default function WriteReviewForm({ prestataireId, locale }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Veuillez choisir une note.'); return }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Vous devez être connecté.'); setLoading(false); return }

    const { error: insertErr } = await supabase.from('reviews').insert({
      prestataire_id: prestataireId,
      client_id: user.id,
      rating,
      comment: comment.trim() || null,
    })

    if (insertErr) {
      setError(insertErr.code === '23505' ? 'Vous avez déjà laissé un avis.' : insertErr.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mt-6">
        <CheckCircle size={20} className="text-verified flex-shrink-0" />
        <div>
          <p className="font-semibold text-dark text-sm">Merci pour votre avis !</p>
          <p className="text-xs text-mid mt-0.5">Il est maintenant visible sur ce profil.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border space-y-4">
      <h3 className="font-semibold text-dark text-sm">Laisser un avis</h3>

      {/* Star picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${(hovered || rating) >= n ? 'text-amber-400' : 'text-border'}`}
              fill={(hovered || rating) >= n ? 'currentColor' : 'none'}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-mid">
            {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        className="input resize-none"
        rows={3}
        placeholder="Décrivez votre expérience (optionnel)…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        maxLength={500}
      />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" loading={loading} disabled={rating === 0}>
        Publier mon avis
      </Button>
    </form>
  )
}
