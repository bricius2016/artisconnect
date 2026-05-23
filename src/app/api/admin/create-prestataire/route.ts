import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Vérifier que l'appelant est admin ou gestionnaire
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'gestionnaire'].includes(profile.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { email, first_name, last_name, phone, business_name, metier_id, city, neighborhood, description, phone_public, hourly_rate_min, hourly_rate_max, years_experience } = body

  if (!email || !first_name || !last_name || !business_name || !metier_id || !city) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Créer le compte auth
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name, last_name, role: 'prestataire' },
  })

  if (authErr) {
    const msg = authErr.message.includes('already been registered')
      ? 'Un compte existe déjà avec cet email.'
      : authErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Upsert profile (le trigger handle_new_user l'a peut-être déjà créé)
  const { error: profileErr } = await admin.from('profiles').upsert({
    id: userId,
    role: 'prestataire',
    first_name,
    last_name,
    phone: phone || null,
  }, { onConflict: 'id' })

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  // 3. Créer prestataire_profile
  const { data: pp, error: ppErr } = await admin.from('prestataire_profiles').insert({
    user_id: userId,
    business_name,
    metier_id,
    city,
    neighborhood: neighborhood || null,
    description: description || null,
    phone_public: phone_public || phone || null,
    hourly_rate_min: hourly_rate_min || null,
    hourly_rate_max: hourly_rate_max || null,
    years_experience: years_experience || null,
    account_status: 'pending',
  }).select('id').single()

  if (ppErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: ppErr.message }, { status: 500 })
  }

  // 4. Envoyer email de définition de mot de passe
  await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/fr/auth/reset-password` },
  })

  return NextResponse.json({ success: true, prestataireId: pp.id, userId })
}
