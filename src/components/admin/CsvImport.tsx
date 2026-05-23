'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Metier { id: string; name_fr: string; slug: string }

interface CsvRow {
  email: string
  first_name: string
  last_name: string
  phone?: string
  business_name: string
  metier_slug: string
  city: string
  neighborhood?: string
  phone_public?: string
  hourly_rate_min?: string
  hourly_rate_max?: string
  years_experience?: string
}

interface ImportResult {
  email: string
  business_name: string
  status: 'success' | 'error'
  message?: string
}

interface Props { metiers: Metier[] }

const REQUIRED_COLS = ['email', 'first_name', 'last_name', 'business_name', 'metier_slug', 'city']

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/\r/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.trim().replace(/\r/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row as unknown as CsvRow
  }).filter(r => r.email)
}

export default function CsvImport({ metiers }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [results, setResults] = useState<ImportResult[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text)
      const errs: string[] = []

      // Validate headers
      const firstLine = text.split('\n')[0].toLowerCase()
      REQUIRED_COLS.forEach(col => {
        if (!firstLine.includes(col)) errs.push(`Colonne manquante : "${col}"`)
      })

      // Validate rows
      parsed.forEach((row, i) => {
        if (!['ouagadougou', 'bobo_dioulasso'].includes(row.city?.toLowerCase())) {
          errs.push(`Ligne ${i + 2} : ville invalide "${row.city}" (ouagadougou ou bobo_dioulasso)`)
        }
        const metier = metiers.find(m => m.slug === row.metier_slug?.toLowerCase())
        if (!metier) {
          errs.push(`Ligne ${i + 2} : métier inconnu "${row.metier_slug}"`)
        }
      })

      setErrors(errs)
      setRows(parsed)
      setResults([])
      setDone(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    setImporting(true)
    const res: ImportResult[] = []

    for (const row of rows) {
      const metier = metiers.find(m => m.slug === row.metier_slug?.toLowerCase())
      const resp = await fetch('/api/admin/create-prestataire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          business_name: row.business_name,
          metier_id: metier?.id ?? '',
          city: row.city?.toLowerCase(),
          neighborhood: row.neighborhood,
          phone_public: row.phone_public,
          hourly_rate_min: row.hourly_rate_min ? Number(row.hourly_rate_min) : undefined,
          hourly_rate_max: row.hourly_rate_max ? Number(row.hourly_rate_max) : undefined,
          years_experience: row.years_experience ? Number(row.years_experience) : undefined,
        }),
      })
      const json = await resp.json()
      res.push({
        email: row.email,
        business_name: row.business_name,
        status: resp.ok ? 'success' : 'error',
        message: resp.ok ? undefined : json.error,
      })
    }

    setResults(res)
    setImporting(false)
    setDone(true)
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <div className="space-y-5">
      {/* Template download */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium text-dark">Modèle CSV</p>
          <p className="text-xs text-soft mt-0.5">Séparateur point-virgule (;) — encodage UTF-8</p>
        </div>
        <a
          href="data:text/csv;charset=utf-8,email;first_name;last_name;phone;business_name;metier_slug;city;neighborhood;phone_public;hourly_rate_min;hourly_rate_max;years_experience%0Aexemple@email.com;Mamadou;Koné;+22670000000;Atelier Koné;menuiserie;ouagadougou;Pissy;+22670000000;5000;15000;10"
          download="modele_prestataires.csv"
          className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark"
        >
          <Download size={14} /> Télécharger
        </a>
      </div>

      {/* Upload */}
      <label className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand transition-colors bg-surface">
        <Upload size={18} className="text-soft flex-shrink-0" />
        <span className="text-sm text-mid">{rows.length > 0 ? `${rows.length} ligne(s) chargée(s)` : 'Choisir un fichier CSV'}</span>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </label>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-600 flex items-center gap-2"><AlertCircle size={14} /> Erreurs de validation</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-red-500 ml-5">{e}</p>)}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && errors.length === 0 && !done && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-surface">
                {['Email', 'Prénom', 'Nom', 'Atelier', 'Métier', 'Ville'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-soft border-b border-border font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border hover:bg-surface/50">
                  <td className="px-3 py-2 text-mid">{r.email}</td>
                  <td className="px-3 py-2 text-dark">{r.first_name}</td>
                  <td className="px-3 py-2 text-dark">{r.last_name}</td>
                  <td className="px-3 py-2 text-dark font-medium">{r.business_name}</td>
                  <td className="px-3 py-2 text-mid">{r.metier_slug}</td>
                  <td className="px-3 py-2 text-mid">{r.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-4 w-full" loading={importing} onClick={handleImport}>
            Importer {rows.length} prestataire{rows.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="space-y-3">
          <div className="flex gap-4 p-4 bg-surface border border-border rounded-xl">
            <span className="flex items-center gap-1.5 text-sm text-verified font-medium"><CheckCircle size={15} /> {successCount} créé{successCount > 1 ? 's' : ''}</span>
            {errorCount > 0 && <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium"><XCircle size={15} /> {errorCount} erreur{errorCount > 1 ? 's' : ''}</span>}
          </div>
          {results.filter(r => r.status === 'error').map((r, i) => (
            <p key={i} className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ✗ {r.business_name} ({r.email}) — {r.message}
            </p>
          ))}
          <Button variant="secondary" onClick={() => { setRows([]); setResults([]); setDone(false); if (inputRef.current) inputRef.current.value = '' }}>
            Nouvel import
          </Button>
        </div>
      )}
    </div>
  )
}
