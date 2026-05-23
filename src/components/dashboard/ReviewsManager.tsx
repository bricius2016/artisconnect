'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import { MessageSquareReply, ChevronDown, ChevronUp } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  response: string | null
  created_at: string
  profiles: { first_name: string; last_name: string; avatar_url: string | null } | null
}

interface Props {
  reviews: Review[]
}

export default function ReviewsManager({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">⭐</div>
        <p className="font-semibold text-dark">Aucun avis pour l&apos;instant</p>
        <p className="text-sm text-soft mt-1">Les avis de vos clients apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}

const QUICK_REPLIES = [
  { emoji: '🙏', label: 'Merci !',       text: '🙏 Merci beaucoup pour votre confiance, c\'était un plaisir de travailler pour vous !' },
  { emoji: '⭐', label: 'Belle note',    text: '⭐ Merci pour cette belle note ! Votre satisfaction est notre priorité.' },
  { emoji: '🤝', label: 'À bientôt',    text: '🤝 Merci ! N\'hésitez pas à faire appel à nous pour vos prochains travaux.' },
  { emoji: '💪', label: 'Engagement',   text: '💪 Merci pour ce retour. Nous mettons tout en œuvre pour offrir un travail de qualité.' },
  { emoji: '😊', label: 'Ravi(e)',       text: '😊 Ravi(e) que le travail vous ait satisfait ! Merci pour votre avis.' },
]

function ReviewCard({ review }: { review: Review }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [response, setResponse] = useState(review.response ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientName = review.profiles
    ? `${review.profiles.first_name} ${review.profiles.last_name}`
    : 'Client'

  async function handleSaveResponse() {
    if (!response.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('reviews')
      .update({ response: response.trim(), response_at: new Date().toISOString() })
      .eq('id', review.id)

    if (err) {
      setError(err.message)
    } else {
      setShowForm(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar name={clientName} src={review.profiles?.avatar_url} size="sm" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-dark text-sm">{clientName}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-soft">
                {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-mid mt-1.5 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>

      {/* Existing response */}
      {review.response && !showForm && (
        <div className="ml-9 pl-3 border-l-2 border-brand">
          <p className="text-xs text-brand font-semibold mb-0.5">Votre réponse</p>
          <p className="text-xs text-mid">{review.response}</p>
        </div>
      )}

      {/* Response form */}
      {showForm && (
        <div className="ml-9 space-y-3">
          {/* Quick emoji replies */}
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                type="button"
                onClick={() => setResponse(qr.text)}
                title={qr.text}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:border-brand hover:bg-brand-pale text-xs text-mid hover:text-brand transition-colors"
              >
                <span>{qr.emoji}</span>
                <span>{qr.label}</span>
              </button>
            ))}
          </div>

          <textarea
            className="input resize-none text-sm"
            rows={3}
            placeholder="Votre réponse publique… ou choisissez une réponse rapide ci-dessus"
            value={response}
            onChange={e => setResponse(e.target.value)}
            maxLength={500}
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" loading={loading} disabled={!response.trim()} onClick={handleSaveResponse}>
              Publier la réponse
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowForm(false); setResponse(review.response ?? '') }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-mid hover:text-brand transition-colors ml-9"
        >
          <MessageSquareReply size={13} />
          {review.response ? 'Modifier la réponse' : 'Répondre à cet avis'}
        </button>
      )}
    </div>
  )
}
