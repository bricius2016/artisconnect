'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  aoResponseId: string
}

export default function ResponseButtons({ aoResponseId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function update(status: 'accepted' | 'rejected') {
    setLoading(status)
    const supabase = createClient()
    await supabase.from('ao_responses').update({ status }).eq('id', aoResponseId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => update('accepted')}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 bg-verified text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading === 'accepted' ? '…' : 'Accepter'}
      </button>
      <button
        onClick={() => update('rejected')}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading === 'rejected' ? '…' : 'Refuser'}
      </button>
    </div>
  )
}
