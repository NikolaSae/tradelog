//src/components/reports/export-panel.tsx

'use client'

import { useState, useRef } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { getTradesForExport } from '@/actions/export'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { TimePeriod } from '@/types/trade'

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 3 months' },
  { value: 'year', label: 'Last year' },
  { value: 'all', label: 'All time' },
] as const

const VALID_PERIODS = PERIODS.map(p => p.value) as string[]

export function ExportPanel() {
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [loading, setLoading] = useState<'csv' | 'excel' | null>(null)
  const exportingRef = useRef(false)

  async function handleExportCSV() {
    if (exportingRef.current) return
    exportingRef.current = true
    setLoading('csv')

    try {
      const data = await getTradesForExport(period)
      if (data.length === 0) {
        toast.error('No trades found for selected period')
        return
      }

      const Papa = (await import('papaparse')).default
      const csv = Papa.unparse(data)
      downloadFile(csv, `tradelog-${period}-${getDateStr()}.csv`, 'text/csv')
      toast.success(`Exported ${data.length} trades`)
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(null)
      exportingRef.current = false
    }
  }

  async function handleExportExcel() {
    if (exportingRef.current) return
    exportingRef.current = true
    setLoading('excel')

    try {
      const data = await getTradesForExport(period)
      if (data.length === 0) {
        toast.error('No trades found for selected period')
        return
      }

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Trades')

      const cols = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 12) }))
      ws['!cols'] = cols

      XLSX.writeFile(wb, `tradelog-${period}-${getDateStr()}.xlsx`)
      toast.success(`Exported ${data.length} trades`)
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(null)
      exportingRef.current = false
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <Label>Select Period</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => {
                // Validacija na klijentu
                if (VALID_PERIODS.includes(p.value)) {
                  setPeriod(p.value)
                }
              }}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                period === p.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">Export Format</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!!loading}
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border/60 hover:bg-muted/30 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">CSV</p>
              <p className="text-xs text-muted-foreground">Universal, opens in any app</p>
            </div>
            {loading === 'csv'
              ? <div className="ml-auto text-xs text-muted-foreground">...</div>
              : <Download className="ml-auto h-4 w-4 text-muted-foreground" />
            }
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!!loading}
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border/60 hover:bg-muted/30 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium">Excel (.xlsx)</p>
              <p className="text-xs text-muted-foreground">Formatted spreadsheet</p>
            </div>
            {loading === 'excel'
              ? <div className="ml-auto text-xs text-muted-foreground">...</div>
              : <Download className="ml-auto h-4 w-4 text-muted-foreground" />
            }
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        Exports include: symbol, direction, prices, lot size, commission, swap, P&L, R-multiple, dates, session, emotion, and notes.
      </div>
    </div>
  )
}

function getDateStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}