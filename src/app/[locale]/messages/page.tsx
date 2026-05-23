import { getTranslations } from 'next-intl/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function MessagesPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('dashboard')
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Get conversations depending on role
  let conversations: ConversationRow[] = []

  if (profile?.role === 'prestataire') {
    const { data: pp } = await supabase.from('prestataire_profiles').select('id').eq('user_id', user.id).single()
    if (pp) {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id, created_at, last_message_at,
          profiles!conversations_client_id_fkey(id, first_name, last_name, avatar_url),
          messages(content, created_at, is_read, sender_id)
        `)
        .eq('prestataire_id', pp.id)
        .order('last_message_at', { ascending: false })
      conversations = (data ?? []) as unknown as ConversationRow[]
    }
  } else {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, created_at, last_message_at,
        prestataire_profiles!conversations_prestataire_id_fkey(id, business_name, avg_rating),
        messages(content, created_at, is_read, sender_id)
      `)
      .eq('client_id', user.id)
      .order('last_message_at', { ascending: false })
    conversations = (data ?? []) as unknown as ConversationRow[]
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-dark mb-6">{t('my_messages')}</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle size={40} className="text-border mx-auto mb-4" />
          <p className="font-semibold text-dark">Aucune conversation</p>
          <p className="text-sm text-soft mt-1">Contactez un prestataire pour démarrer une discussion.</p>
          <Link href={`/${locale}/search`} className="btn-primary text-sm mt-4 inline-flex">
            Trouver un prestataire
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isPrestataire = profile?.role === 'prestataire'
            const cl = Array.isArray(conv.profiles) ? conv.profiles[0] : conv.profiles
            const pp2 = Array.isArray(conv.prestataire_profiles) ? conv.prestataire_profiles[0] : conv.prestataire_profiles
            const otherPerson = isPrestataire
              ? { name: `${cl?.first_name ?? ''} ${cl?.last_name ?? ''}`, avatar: cl?.avatar_url ?? null }
              : { name: pp2?.business_name ?? '', avatar: null }

            const lastMsg = conv.messages?.sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            const hasUnread = conv.messages?.some(m => !m.is_read && m.sender_id !== user.id)

            return (
              <Link
                key={conv.id}
                href={`/${locale}/messages/${conv.id}`}
                className="flex items-center gap-4 p-4 bg-white border border-border rounded-2xl hover:border-brand transition-colors"
              >
                <div className="relative">
                  <Avatar name={otherPerson.name} src={otherPerson.avatar} size="md" />
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${hasUnread ? 'font-bold text-dark' : 'font-medium text-dark'}`}>
                    {otherPerson.name}
                  </p>
                  {lastMsg && (
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-dark font-medium' : 'text-soft'}`}>
                      {lastMsg.sender_id === user.id ? 'Vous : ' : ''}{lastMsg.content}
                    </p>
                  )}
                </div>
                {conv.last_message_at && (
                  <p className="text-xs text-soft flex-shrink-0">
                    {new Date(conv.last_message_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ConversationRow {
  id: string
  created_at: string
  last_message_at: string | null
  profiles?: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null
  prestataire_profiles?: { id: string; business_name: string; avg_rating: number | null } | null
  messages?: Array<{ content: string; created_at: string; is_read: boolean; sender_id: string }>
}
