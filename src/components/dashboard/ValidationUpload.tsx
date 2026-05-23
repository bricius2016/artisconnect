'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Upload, FileCheck, AlertCircle } from 'lucide-react'

interface Props {
  prestataireId: string
  locale: string
  existingRccm: string | null
  existingId: string | null
}

export default function ValidationUpload({ prestataireId, locale, existingRccm, existingId }: Props) {
  const router = useRouter()
  const [rccmFile, setRccmFile] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rccmFile || !idFile) {
      setError('Veuillez sélectionner les deux documents.')
      return
    }
    setUploading(true)
    setError(null)

    const supabase = createClient()

    // Upload RCCM
    const rccmPath = `validations/${prestataireId}/rccm-${Date.now()}.${rccmFile.name.split('.').pop()}`
    const { error: rccmErr } = await supabase.storage
      .from('documents')
      .upload(rccmPath, rccmFile, { upsert: true })

    if (rccmErr) { setError('Erreur upload RCCM : ' + rccmErr.message); setUploading(false); return }

    // Upload ID
    const idPath = `validations/${prestataireId}/id-${Date.now()}.${idFile.name.split('.').pop()}`
    const { error: idErr } = await supabase.storage
      .from('documents')
      .upload(idPath, idFile, { upsert: true })

    if (idErr) { setError('Erreur upload pièce d\'identité : ' + idErr.message); setUploading(false); return }

    // Get public URLs
    const { data: rccmUrl } = supabase.storage.from('documents').getPublicUrl(rccmPath)
    const { data: idUrl } = supabase.storage.from('documents').getPublicUrl(idPath)

    // Update prestataire profile
    const { error: updateErr } = await supabase
      .from('prestataire_profiles')
      .update({
        rccm_doc_url: rccmUrl.publicUrl,
        id_doc_url: idUrl.publicUrl,
        account_status: 'step1_done',
      })
      .eq('id', prestataireId)

    if (updateErr) { setError(updateErr.message); setUploading(false); return }

    router.refresh()
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-3 bg-brand-pale rounded-xl p-4">
        <AlertCircle size={16} className="text-brand flex-shrink-0 mt-0.5" />
        <p className="text-xs text-mid leading-relaxed">
          Pour apparaître dans la recherche, votre identité et votre activité doivent être vérifiées.
          Uploadez vos documents officiels ci-dessous.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FileUploadField
          label="RCCM (Registre du Commerce)"
          hint="PDF, JPG ou PNG — max 5 Mo"
          accept=".pdf,.jpg,.jpeg,.png"
          existing={existingRccm}
          onChange={setRccmFile}
        />

        <FileUploadField
          label="Pièce d'identité (CNI ou passeport)"
          hint="PDF, JPG ou PNG — max 5 Mo"
          accept=".pdf,.jpg,.jpeg,.png"
          existing={existingId}
          onChange={setIdFile}
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={uploading}
          disabled={!rccmFile || !idFile}
        >
          <Upload size={16} />
          Envoyer mes documents
        </Button>
      </form>
    </div>
  )
}

interface FileUploadFieldProps {
  label: string
  hint: string
  accept: string
  existing: string | null
  onChange: (f: File | null) => void
}

function FileUploadField({ label, hint, accept, existing, onChange }: FileUploadFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileName(file?.name ?? null)
    onChange(file)
  }

  return (
    <div>
      <label className="label">{label}</label>
      <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand transition-colors bg-surface">
        {fileName || existing ? (
          <FileCheck size={18} className="text-verified flex-shrink-0" />
        ) : (
          <Upload size={18} className="text-soft flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark truncate">
            {fileName ?? (existing ? 'Document déjà uploadé ✓' : 'Cliquez pour sélectionner')}
          </p>
          <p className="text-xs text-soft">{hint}</p>
        </div>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      </label>
    </div>
  )
}
