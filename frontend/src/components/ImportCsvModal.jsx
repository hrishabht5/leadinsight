import { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { leadsApi } from '../services/leads'
import toast from 'react-hot-toast'

const EXPECTED_HEADERS = ['name', 'phone', 'email', 'city', 'source', 'campaign_name']
const HEADER_ALIASES = {
  'full name': 'name', 'fullname': 'name', 'contact': 'name', 'customer': 'name',
  'mobile': 'phone', 'telephone': 'phone', 'tel': 'phone', 'number': 'phone',
  'mail': 'email', 'e-mail': 'email',
  'location': 'city', 'region': 'city',
  'platform': 'source', 'channel': 'source',
  'campaign': 'campaign_name', 'ad campaign': 'campaign_name', 'campaign name': 'campaign_name',
}

function normalizeHeader(h) {
  const lower = h.trim().toLowerCase()
  return HEADER_ALIASES[lower] || (EXPECTED_HEADERS.includes(lower) ? lower : null)
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV must have a header row and at least one data row.' }

  // Parse a single CSV line respecting quoted values
  function parseLine(line) {
    const cols = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map(normalizeHeader)

  if (!headers.includes('name')) {
    return { headers: [], rows: [], error: 'CSV must have a "name" column.' }
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.every(c => !c)) continue // skip blank lines
    const row = {}
    headers.forEach((h, idx) => {
      if (h) row[h] = cols[idx] || ''
    })
    rows.push(row)
  }

  return { headers: headers.filter(Boolean), rows, error: null }
}

const VALID_SOURCES = ['facebook', 'instagram']

function normalizeRow(row) {
  const source = (row.source || '').toLowerCase()
  return {
    name: (row.name || '').trim(),
    phone: (row.phone || '').trim() || null,
    email: (row.email || '').trim() || null,
    city:  (row.city  || '').trim() || null,
    source: VALID_SOURCES.includes(source) ? source : 'facebook',
    campaign_name: (row.campaign_name || '').trim() || null,
  }
}

export default function ImportCsvModal({ onClose, onImported }) {
  const [stage, setStage] = useState('upload')   // upload | preview | result
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState(null)     // { headers, rows }
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)     // { imported, skipped, errors }
  const fileRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const { headers, rows, error } = parseCsv(e.target.result)
      if (error) { setParseError(error); return }
      setParsed({ headers, rows })
      setParseError(null)
      setStage('preview')
    }
    reader.readAsText(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleImport() {
    if (!parsed) return
    setImporting(true)
    try {
      const leads = parsed.rows.map(normalizeRow).filter(r => r.name)
      if (!leads.length) { toast.error('No valid rows to import'); setImporting(false); return }
      const res = await leadsApi.importLeads(leads)
      setResult(res)
      setStage('result')
      if (res.imported > 0) {
        toast.success(`${res.imported} lead${res.imported !== 1 ? 's' : ''} imported`)
        onImported?.()
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const previewRows = parsed?.rows.slice(0, 5) || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-green" />
            <h2 className="font-syne font-bold text-lg">Import CSV</h2>
          </div>
          <button onClick={onClose} className="text-dim hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4">

          {/* ── STAGE: upload ── */}
          {stage === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors
                  ${dragging ? 'border-green/60 bg-green/5' : 'border-white/10 hover:border-white/20'}`}
              >
                <FileText size={36} className="text-dim" />
                <p className="text-sm text-muted text-center">
                  Drag & drop a <span className="text-white">.csv</span> file here, or <span className="text-green underline">browse</span>
                </p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red/10 border border-red/20 rounded-xl p-3 text-red text-sm">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Format hint */}
              <div className="bg-s2 rounded-xl p-4 space-y-2">
                <p className="text-xs text-muted font-medium uppercase tracking-wider">Expected columns</p>
                <div className="flex flex-wrap gap-2">
                  {['name *', 'phone', 'email', 'city', 'source', 'campaign_name'].map(h => (
                    <span key={h} className={`text-xs px-2.5 py-1 rounded-lg ${h.includes('*') ? 'bg-green/10 text-green border border-green/20' : 'bg-white/5 text-dim border border-white/10'}`}>
                      {h}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-dim">Source accepts: <span className="text-muted">facebook</span>, <span className="text-muted">instagram</span> (defaults to facebook)</p>
              </div>
            </>
          )}

          {/* ── STAGE: preview ── */}
          {stage === 'preview' && parsed && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">
                  <span className="text-white font-semibold">{parsed.rows.length}</span> rows detected
                  {parsed.rows.length > 5 && <span className="text-dim"> — showing first 5</span>}
                </p>
                <button onClick={() => { setStage('upload'); setParsed(null) }} className="text-xs text-dim hover:text-muted underline underline-offset-2">
                  Change file
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-s2">
                      {parsed.headers.map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-dim font-medium capitalize">{h.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        {parsed.headers.map(h => (
                          <td key={h} className="px-3 py-2.5 text-muted max-w-[160px] truncate">{row[h] || <span className="text-dim/40">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStage('upload'); setParsed(null) }} className="btn-ghost flex-1">
                  Back
                </button>
                <button onClick={handleImport} disabled={importing} className="btn-primary flex-1 disabled:opacity-50">
                  {importing ? 'Importing…' : `Import ${parsed.rows.length} leads`}
                </button>
              </div>
            </>
          )}

          {/* ── STAGE: result ── */}
          {stage === 'result' && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green/10 border border-green/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-syne text-green">{result.imported}</p>
                  <p className="text-xs text-muted mt-1">Imported</p>
                </div>
                <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-syne text-amber">{result.skipped}</p>
                  <p className="text-xs text-muted mt-1">Skipped</p>
                </div>
                <div className="bg-red/10 border border-red/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-syne text-red">{result.errors.length}</p>
                  <p className="text-xs text-muted mt-1">Errors</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red/5 border border-red/20 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs text-red font-medium mb-2">Errors</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-dim flex items-start gap-1.5">
                      <AlertCircle size={12} className="text-red shrink-0 mt-0.5" />
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {result.imported > 0 && (
                <div className="flex items-center gap-2 text-green text-sm">
                  <CheckCircle2 size={16} />
                  Leads imported and available in your dashboard.
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
