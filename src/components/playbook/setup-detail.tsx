//src/components/playbook/setup-detail.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteSetup } from '@/actions/playbook'
import { Button } from '@/components/ui/button'
import { SetupForm } from './setup-form'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface SetupDetailProps {
  setup: {
    id: string
    name: string
    description?: string | null
    timeframe?: string | null
    markets?: string | null
    entryRules?: string | null
    exitRules?: string | null
    riskRules?: string | null
    rules?: string | null
  }
}

function RuleSection({ title, content }: { title: string; content?: string | null }) {
  if (!content) return null
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

export function SetupDetail({ setup }: SetupDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  async function handleDelete() {
    await deleteSetup(setup.id)
    toast.success('Setup deleted')
    router.push('/playbook')
  }

  if (editing) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <SetupForm setup={setup} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{setup.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This setup will be permanently deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {(setup.timeframe || setup.markets) && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">
          {setup.timeframe && (
            <span>⏱ Timeframe: <strong className="text-foreground">{setup.timeframe}</strong></span>
          )}
          {setup.markets && (
            <span>📊 Markets: <strong className="text-foreground">{setup.markets}</strong></span>
          )}
        </div>
      )}

      <RuleSection title="Entry Rules" content={setup.entryRules} />
      <RuleSection title="Exit Rules" content={setup.exitRules} />
      <RuleSection title="Risk Rules" content={setup.riskRules} />
      {/* Fallback za legacy rules polje */}
      {!setup.entryRules && !setup.exitRules && setup.rules && (
        <RuleSection title="Rules" content={setup.rules} />
      )}
    </div>
  )
}