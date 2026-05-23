'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'

type Role = 'client' | 'prestataire' | 'entreprise' | 'admin' | 'gestionnaire'

interface Profile {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  role: Role
  created_at: string
}

interface Props {
  profiles: Profile[]
}

const ROLE_LABELS: Record<Role, { label: string; color: string }> = {
  client:       { label: 'Client',        color: 'bg-surface text-mid border-border' },
  prestataire:  { label: 'Prestataire',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  entreprise:   { label: 'Entreprise',    color: 'bg-purple-50 text-purple-700 border-purple-200' },
  gestionnaire: { label: 'Gestionnaire',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  admin:        { label: 'Admin',         color: 'bg-brand-pale text-brand border-brand/30' },
}

const ASSIGNABLE_ROLES: Role[] = ['client', 'prestataire', 'entreprise', 'gestionnaire', 'admin']

export default function ComptesManager({ profiles }: Props) {
  const [search, setSearch] = useState('')

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <input
        className="input"
        placeholder="Rechercher par nom ou téléphone…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-xs text-soft">{filtered.length} compte{filtered.length > 1 ? 's' : ''}</p>

      <div className="space-y-2">
        {filtered.map(p => (
          <ProfileRow key={p.id} profile={p} />
        ))}
      </div>
    </div>
  )
}

function ProfileRow({ profile: p }: { profile: Profile }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const roleInfo = ROLE_LABELS[p.role]
  const fullName = `${p.first_name} ${p.last_name}`

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role
    if (newRole === p.role) return
    setLoading(true)
    await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: p.id, role: newRole }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <Avatar name={fullName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark truncate">{fullName}</p>
        <p className="text-xs text-soft">{p.phone ?? '—'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${roleInfo.color}`}>
        {roleInfo.label}
      </span>
      <select
        value={p.role}
        onChange={handleRoleChange}
        disabled={loading}
        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-mid hover:border-brand focus:outline-none focus:border-brand transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {ASSIGNABLE_ROLES.map(r => (
          <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
        ))}
      </select>
    </div>
  )
}
