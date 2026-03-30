//src/components/import/import-form.tsx
'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { parseCSVHeaders, importCSVWithMapping } from '@/actions/import'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ALLOWED_TARGET_COLUMNS,
  COLUMN_LABELS,
  REQUIRED_COLUMNS,
  type TargetColumn,
  type ColumnMapping,
} from '@/lib/validators/import'

type Step = 'upload' | 'mapping' | 'result'

interface ParsedHeaders {
  headers: string[]
  preview: Record<string, string>[]
  isCTrader: boolean
}

interface ImportResult {
  imported: number
  duplicates: number
  skipped: number
  errors: string[]
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null)
  const importingRef = useRef(false)
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState<ParsedHeaders | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFileChange(f: File | null) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are supported')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File too large (max 5MB)')
      return
    }
    if (f.size === 0) {
      toast.error('File is empty')
      return
    }
    setFile(f)
    setParsedHeaders(null)
    setMapping({})
    setResult(null)
    setStep('upload')
  }

  async function handleParse() {
  if (!file || parsing) return
  setParsing(true)

  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await parseCSVHeaders(formData)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setParsedHeaders(result as ParsedHeaders)

    if (result.isCTrader) {
      toast.success('cTrader format detected — importing automatically')
      // FIX: proslijedi isCTrader direktno, ne čekaj state
      await handleImportDirect(result.isCTrader)
      return
    }

      // Auto-mapping za poznate nazive kolona
      const autoMapping: Record<string, string> = {}
      for (const header of result.headers ?? []) {
        const lower = header.toLowerCase().replace(/[\s_-]/g, '')
        if (lower.includes('symbol') || lower.includes('instrument')) autoMapping[header] = 'symbol'
        else if (lower.includes('direction') || lower.includes('side') || lower.includes('type')) autoMapping[header] = 'direction'
        else if (lower.includes('entry') && lower.includes('price')) autoMapping[header] = 'entryPrice'
        else if (lower.includes('exit') && lower.includes('price')) autoMapping[header] = 'exitPrice'
        else if (lower.includes('stoploss') || lower.includes('sl')) autoMapping[header] = 'stopLoss'
        else if (lower.includes('takeprofit') || lower.includes('tp')) autoMapping[header] = 'takeProfit'
        else if (lower.includes('lot') || lower.includes('size') || lower.includes('volume')) autoMapping[header] = 'lotSize'
        else if (lower.includes('commission')) autoMapping[header] = 'commission'
        else if (lower.includes('swap')) autoMapping[header] = 'swap'
        else if (lower.includes('open') && (lower.includes('time') || lower.includes('date') || lower.includes('at'))) autoMapping[header] = 'openedAt'
        else if (lower.includes('close') && (lower.includes('time') || lower.includes('date') || lower.includes('at'))) autoMapping[header] = 'closedAt'
        else if (lower.includes('note') || lower.includes('comment')) autoMapping[header] = 'notes'
        else autoMapping[header] = '__skip__'
      }
      setMapping(autoMapping)
      setStep('mapping')
    } catch {
      toast.error('Failed to parse file')
    } finally {
      setParsing(false)
    }
  }
async function handleImportDirect(isCTrader: boolean) {
  if (!file || importingRef.current) return

  importingRef.current = true
  setImporting(true)

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify({}))
    if (isCTrader) {
      formData.append('isCTrader', 'true')  // ← sada se ispravno šalje
    }

    const res = await importCSVWithMapping(formData)

    if (res.error) {
      toast.error(res.error)
      return
    }

    setResult({
      imported: res.imported ?? 0,
      duplicates: res.duplicates ?? 0,
      skipped: res.skipped ?? 0,
      errors: res.errors ?? [],
    })
    setStep('result')
    toast.success(`Successfully imported ${res.imported} trades`)
  } catch {
    toast.error('Import failed. Please try again.')
  } finally {
    setImporting(false)
    importingRef.current = false
  }
}
  async function handleImport(customMapping?: Record<string, string>) {
  if (!file || importingRef.current) return

  const finalMapping = customMapping ?? mapping

  // Validacija — samo za non-cTrader
  if (!parsedHeaders?.isCTrader && Object.keys(finalMapping).length > 0) {
    const mappedTargets = Object.values(finalMapping).filter(v => v !== '__skip__')
    const missingRequired = REQUIRED_COLUMNS.filter(req => !mappedTargets.includes(req))
    if (missingRequired.length > 0) {
      toast.error(`Please map required columns: ${missingRequired.map(c => COLUMN_LABELS[c]).join(', ')}`)
      return
    }
  }

  importingRef.current = true
  setImporting(true)

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(finalMapping))
    // Proslijedi isCTrader flag serveru
    if (parsedHeaders?.isCTrader) {
      formData.append('isCTrader', 'true')
    }

    const res = await importCSVWithMapping(formData)

      if (res.error) {
        toast.error(res.error)
        return
      }

      setResult({
        imported: res.imported ?? 0,
        duplicates: res.duplicates ?? 0,
        skipped: res.skipped ?? 0,
        errors: res.errors ?? [],
      })
      setStep('result')
      toast.success(`Successfully imported ${res.imported} trades`)
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setImporting(false)
      importingRef.current = false
    }
  }

  function reset() {
    setFile(null)
    setParsedHeaders(null)
    setMapping({})
    setResult(null)
    setStep('upload')
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Step 1: Upload ────────────────────────────────────────────────────────

  if (step === 'upload' || !parsedHeaders) {
    return (
      <div className="space-y-6">
        {/* Supported formats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Supported Formats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'cTrader', desc: 'Auto-detected — imports without mapping', icon: '📊' },
              { name: 'Custom CSV', desc: 'Any CSV — map columns manually', icon: '📄' },
            ].map(fmt => (
              <div key={fmt.name} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="text-xl">{fmt.icon}</span>
                <div>
                  <p className="font-medium text-sm">{fmt.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            handleFileChange(e.dataTransfer.files[0] ?? null)
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
            dragging ? 'border-primary bg-primary/5'
              : file ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-border hover:border-border/60 hover:bg-muted/30'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-10 w-10" />
              <p className="font-medium">Drop your CSV file here</p>
              <p className="text-sm">or click to browse</p>
            </div>
          )}
        </div>

        {file && (
          <div className="flex gap-3">
            <Button onClick={handleParse} disabled={parsing} className="flex-1">
              {parsing ? 'Analyzing...' : 'Continue →'}
            </Button>
            <Button variant="outline" onClick={reset} disabled={parsing}>Clear</Button>
          </div>
        )}
      </div>
    )
  }

  // ── Step 2: Column Mapping ────────────────────────────────────────────────

  if (step === 'mapping') {
    const mappedTargets = Object.values(mapping).filter(v => v !== '__skip__')
    const missingRequired = REQUIRED_COLUMNS.filter(req => !mappedTargets.includes(req))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Map Columns</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Match your CSV columns to Tradelog fields
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>Change File</Button>
        </div>

        {/* Required columns warning */}
        {missingRequired.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-400">
            <p className="font-medium mb-1">Required columns not mapped:</p>
            <p>{missingRequired.map(c => COLUMN_LABELS[c]).join(', ')}</p>
          </div>
        )}

        {/* Mapping table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Your CSV Column</span>
            <span className="px-4"></span>
            <span>Tradelog Field</span>
          </div>

          <div className="divide-y divide-border">
            {parsedHeaders.headers.map(header => {
              const target = mapping[header] ?? '__skip__'
              const isRequired = target !== '__skip__' && REQUIRED_COLUMNS.includes(target as TargetColumn)
              const preview = parsedHeaders.preview[0]?.[header]

              return (
                <div
                  key={header}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 px-4 py-3"
                >
                  {/* Source column */}
                  <div>
                    <p className="text-sm font-medium">{header}</p>
                    {preview && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                        e.g. {preview}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="px-4">
                    <ArrowRight className={cn(
                      'h-4 w-4',
                      target === '__skip__' ? 'text-muted-foreground/30' : 'text-primary'
                    )} />
                  </div>

                  {/* Target select */}
                  <div>
                    <select
                      value={target}
                      onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                      className={cn(
                        'w-full h-9 px-3 rounded-lg border bg-background text-sm transition-colors',
                        target === '__skip__'
                          ? 'border-border text-muted-foreground'
                          : isRequired
                          ? 'border-primary/50 text-foreground'
                          : 'border-emerald-500/30 text-foreground'
                      )}
                    >
                      <option value="__skip__">— Skip this column —</option>
                      {ALLOWED_TARGET_COLUMNS.map(col => (
                        <option
                          key={col}
                          value={col}
                          disabled={
                            // Spriječi duplikate — ista target ne može biti mapirana 2x
                            col !== target &&
                            Object.values(mapping).includes(col)
                          }
                        >
                          {COLUMN_LABELS[col]}
                          {REQUIRED_COLUMNS.includes(col) ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        {parsedHeaders.preview.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Data Preview (first row)
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <tbody>
                  {parsedHeaders.headers.slice(0, 8).map(h => (
                    <tr key={h} className="border-b border-border/40 last:border-0">
                      <td className="py-1 pr-4 text-muted-foreground font-medium w-1/3">{h}</td>
                      <td className="py-1 font-mono">{parsedHeaders.preview[0]?.[h] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => handleImport()}
            disabled={importing || missingRequired.length > 0}
            className="flex-1"
          >
            {importing ? 'Importing...' : `Import ${file?.name}`}
          </Button>
          <Button variant="outline" onClick={reset} disabled={importing}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 3: Result ────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-emerald-500" />
        <h3 className="font-semibold">Import Complete</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{result?.imported}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Imported</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{result?.duplicates}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Duplicates</p>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{result?.skipped}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
        </div>
      </div>

      {result?.errors && result.errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-orange-500">
            <AlertCircle className="h-4 w-4" />
            <span>Row errors ({result.errors.length})</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
            {result.errors.map((err, i) => (
              <p key={i} className="text-xs text-muted-foreground font-mono">{err}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <a href="/trades">View Trades</a>
        </Button>
        <Button variant="outline" onClick={reset}>Import Another</Button>
      </div>
    </div>
  )
}