//src/components/import/import-form.tsx

'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { importCSV } from '@/actions/import'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ImportStatus = 'idle' | 'parsing' | 'success' | 'error'

interface ImportSummary {
  imported: number
  duplicates: number
  skipped: number
  errors: string[]
}

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  function handleFileChange(f: File | null) {
    if (!f) return
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      toast.error('Only CSV files are supported')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      return
    }
    setFile(f)
    setStatus('idle')
    setSummary(null)
  }

  async function handleImport() {
    if (!file) return
    setStatus('parsing')

    const formData = new FormData()
    formData.append('file', file)

    const result = await importCSV(formData)

    if (result.error) {
      setStatus('error')
      toast.error(result.error)
      return
    }

    setStatus('success')
    setSummary({
      imported: result.imported ?? 0,
      duplicates: result.duplicates ?? 0,
      skipped: result.skipped ?? 0,
      errors: result.errors ?? [],
    })

    toast.success(`Successfully imported ${result.imported} trades`)
  }

  function reset() {
    setFile(null)
    setStatus('idle')
    setSummary(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Supported formats info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Supported Formats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'cTrader', desc: 'History export CSV with Deal ID column', icon: '📊' },
            { name: 'Generic CSV', desc: 'Any CSV with symbol, direction, entry/exit columns', icon: '📄' },
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
          dragging
            ? 'border-primary bg-primary/5'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-border hover:border-border/60 hover:bg-muted/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-10 w-10 text-emerald-500" />
            <p className="font-semibold">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-10 w-10" />
            <p className="font-medium">Drop your CSV file here</p>
            <p className="text-sm">or click to browse</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {file && status !== 'success' && (
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={status === 'parsing'}
            className="flex-1"
          >
            {status === 'parsing' ? 'Importing...' : `Import ${file.name}`}
          </Button>
          <Button variant="outline" onClick={reset} disabled={status === 'parsing'}>
            Clear
          </Button>
        </div>
      )}

      {/* Summary */}
      {summary && status === 'success' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">Import Complete</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">{summary.imported}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Imported</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summary.duplicates}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Duplicates</p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{summary.skipped}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm text-orange-500">
                <AlertCircle className="h-4 w-4" />
                <span>Row errors ({summary.errors.length})</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                {summary.errors.map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{err}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <a href="/trades">View Trades</a>
            </Button>
            <Button variant="outline" onClick={reset}>
              Import Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}