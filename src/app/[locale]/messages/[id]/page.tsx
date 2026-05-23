import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import MessageThread from '@/components/messages/MessageThread'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { locale, id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id,
      client_id,
      profiles!conversations_client_id_fkey(id, first_name, last_name, avatar_url),
      prestataire_profiles!conversations_prestataire_id_fkey(id, business_name, user_id)
    `)
    .eq('id', id)
    .single()

  if (!conv) notFound()

  // Supabase returns joins as arrays — normalize
  const pp = Array.isArray(conv.prestataire_profiles) ? conv.prestataire_profiles[0] : conv.prestataire_profiles
  const cl = Array.isArray(conv.profiles) ? conv.profiles[0] : conv.profiles

  // Verify user is part of this conversation
  const isClient = conv.client_id === user.id
  const isPrestataire = pp?.user_id === user.id
  if (!isClient && !isPrestataire) notFound()

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .neq('sender_id', user.id)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const otherPerson = isClient
    ? { name: pp?.business_name ?? '', avatar: null }
    : { name: `${cl?.first_name ?? ''} ${cl?.last_name ?? ''}`, avatar: cl?.avatar_url ?? null }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <Link href={`/${locale}/messages`} className="p-2 hover:bg-surface rounded-lg text-mid hover:text-dark transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <Avatar name={otherPerson.name} src={otherPerson.avatar} size="md" />
        <div>
          <p className="font-semibold text-dark text-sm">{otherPerson.name}</p>
        </div>
      </div>

      {/* Thread */}
      <MessageThread
        conversationId={id}
        userId={user.id}
        initialMessages={messages ?? []}
        locale={locale}
      />
    </div>
  )
}
