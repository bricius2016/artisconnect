'use client'

import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  prestataireId: string
  locale: string
  label: string
}

export default function ContactButton({ prestataireId, locale, label }: Props) {
  const router = useRouter()

  async function handleContact() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/prestataires/${prestataireId}`)
      return
    }

    // Create or get conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', user.id)
      .eq('prestataire_id', prestataireId)
      .single()

    if (existing) {
      router.push(`/${locale}/messages/${existing.id}`)
      return
    }

    const { data: created } = await supabase
      .from('conversations')
      .insert({ client_id: user.id, prestataire_id: prestataireId })
      .select('id')
      .single()

    if (created) {
      router.push(`/${locale}/messages/${created.id}`)
    }
  }

  return (
    <button
      onClick={handleContact}
      className="flex items-center gap-3 w-full px-4 py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors"
    >
      <MessageCircle size={16} />
      {label}
    </button>
  )
}
