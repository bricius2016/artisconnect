'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ChevronRight, FileText, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'

type AccountStatus = 'pending' | 'step1_done' | 'step2_done' | 'verified' | 'rejected' | 'suspended'

interface Prestataire {
  id: string
  business_name: string
  city: string
  account_status: AccountStatus
  rccm_doc_url: string | null
  id_doc_url: string | null
  rccm_doc_signed: string | null
  id_doc_signed: string | null
  created_at: string
  profiles: { first_name: string; last_name: string; phone: string | null } | null
}

interface Props {
  prestataires: Prestataire[]
}

const STATUS_LABEL: Record<AccountStatus, { label: string; color: string }> = {
  pending:    { label: 'En attente',         color: 'bg-surface text-soft border-border' },
  step1_done: { label: 'Docs reçus',         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  step2_done: { label: 'Visite à faire',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified:   { label: 'Vérifié',            color: 'bg-green-50 text-verified border-green-200' },
  rejected:   { label: 'Refusé',             color: 'bg-red-50 text-red-600 border-red-200' },
  suspended:  { label: 'Suspendu',           color: 'bg-red-50 text-red-600 border-red-200' },
}

export default function ValidationManager({ prestataires }: Props) {
  const [filter, setFilter] = useState<AccountStatus | 'all'>('all')

  const filtered = filter === 'all'
    ? prestataires
    : prestataires.filter(p => p.account_status === filter)

  const counts = prestataires.reduce((acc, p) => {
    acc[p.account_status] = (acc[p.account_status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'Tous', count: prestataires.length },
          { key: 'step1_done', label: 'Docs reçus', count: counts.step1_done ?? 0 },
          { key: 'step2_done', label: 'Visite à faire', count: counts.step2_done ?? 0 },
          { key: 'pending', label: 'En attente', count: counts.pending ?? 0 },
          { key: 'verified', label: 'Vérifiés', count: counts.verified ?? 0 },
          { key: 'rejected', label: 'Refusés', count: counts.rejected ?? 0 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${filter === tab.key ? 'bg-brand text-white border-brand' : 'bg-white text-mid border-border hover:border-brand hover:text-brand'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-surface text-soft'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-soft">
          <CheckCircle size={32} className="mx-auto mb-3 text-border" />
          <p className="font-medium">Aucun dossier dans cette catégorie</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(p => (
          <PrestataireCard key={p.id} prestataire={p} />
        ))}
      </div>
    </div>
  )
}

function PrestataireCard({ prestataire: p }: { prestataire: Prestataire }) {
  const router = useRouter()
  const [loading, setLoading] = useState<AccountStatus | null>(null)
  const [expanded, setExpanded] = useState(false)

  const statusInfo = STATUS_LABEL[p.account_status]
  const clientName = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : '—'

  async function updateStatus(newStatus: AccountStatus) {
    setLoading(newStatus)
    await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestataireId: p.id, status: newStatus }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-dark">{p.business_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-soft mt-0.5">
            {clientName} · {p.city === 'ouagadougou' ? 'Ouagadougou' : 'Bobo-Dioulasso'} ·{' '}
            {new Date(p.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <ChevronRight size={16} className={`text-soft flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border space-y-4">
          {/* Documents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <DocLink label="RCCM" signedUrl={p.rccm_doc_signed} rawUrl={p.rccm_doc_url} />
            <DocLink label="Pièce d'identité" signedUrl={p.id_doc_signed} rawUrl={p.id_doc_url} />
          </div>

          {p.profiles?.phone && (
            <p className="text-sm text-mid">📞 {p.profiles.phone}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {p.account_status === 'step1_done' && (
              <>
                <Button size="sm" onClick={() => updateStatus('step2_done')} loading={loading === 'step2_done'}>
                  <CheckCircle size={14} /> Docs validés → Programmer visite
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateStatus('rejected')} loading={loading === 'rejected'}>
                  <XCircle size={14} /> Rejeter
                </Button>
              </>
            )}
            {p.account_status === 'step2_done' && (
              <>
                <Button size="sm" onClick={() => updateStatus('verified')} loading={loading === 'verified'}>
                  <CheckCircle size={14} /> Visite OK → Vérifier le compte
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateStatus('rejected')} loading={loading === 'rejected'}>
                  <XCircle size={14} /> Rejeter
                </Button>
              </>
            )}
            {p.account_status === 'pending' && (
              <p className="text-xs text-soft italic">En attente d&apos;upload de documents.</p>
            )}
            {p.account_status === 'verified' && (
              <Button size="sm" variant="secondary" onClick={() => updateStatus('suspended')} loading={loading === 'suspended'}>
                Suspendre
              </Button>
            )}
            {(p.account_status === 'rejected' || p.account_status === 'suspended') && (
              <Button size="sm" onClick={() => updateStatus('pending')} loading={loading === 'pending'}>
                Réactiver (→ pending)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DocLink({ label, signedUrl, rawUrl }: { label: string; signedUrl: string | null; rawUrl: string | null }) {
  const url = signedUrl ?? rawUrl
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${url ? 'border-border bg-surface' : 'border-dashed border-border'}`}>
      <FileText size={16} className={url ? 'text-brand' : 'text-soft'} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-dark">{label}</p>
        <p className="text-xs text-soft">{url ? 'Document disponible' : 'Non uploadé'}</p>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white rounded-lg transition-colors">
          <ExternalLink size={13} className="text-mid hover:text-brand" />
        </a>
      )}
    </div>
  )
}
