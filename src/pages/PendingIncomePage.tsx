import { useState, type FormEvent } from 'react'
import { Clock, Plus, Trash2, Check } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { PendingIncome, PendingIncomeType, Transaction } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency, formatDate, todayISO } from '../lib/format'

const TYPE_LABELS: Record<PendingIncomeType, string> = {
  salaire: 'Salaire',
  indemnite: 'Indemnité',
  autre: 'Autre',
}

export function PendingIncomePage() {
  const { data: pending, add, remove } = useCollection<PendingIncome>('pendingIncome', 'expectedDate')
  const { add: addTransaction } = useCollection<Transaction>('transactions')
  const [open, setOpen] = useState(false)

  const waiting = pending.filter((p) => p.status === 'pending')
  const totalWaiting = waiting.reduce((s, p) => s + p.amount, 0)

  async function markReceived(p: PendingIncome) {
    await addTransaction({
      type: 'income',
      date: todayISO(),
      amount: p.amount,
      categoryId: '',
      description: p.label,
    })
    await remove(p.id)
  }

  return (
    <div>
      <PageHeader
        title="À venir"
        description="Salaires ou indemnités prévus, pas encore arrivés sur ton compte."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Ajouter
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total attendu" value={formatCurrency(totalWaiting)} />
        <StatCard label="En attente" value={String(waiting.length)} />
      </div>

      <Card>
        {waiting.length === 0 ? (
          <EmptyState icon={<Clock size={28} />} title="Rien en attente" description="Ajoute un salaire ou une indemnité à venir." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {waiting.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.label}</p>
                  <p className="text-xs text-slate-400">
                    {TYPE_LABELS[p.type]} · attendu le {formatDate(p.expectedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(p.amount)}
                  </span>
                  <button
                    onClick={() => markReceived(p)}
                    title="Marquer comme reçu"
                    className="rounded-full bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer « ${p.label} » ?`)) remove(p.id)
                    }}
                    className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && <PendingIncomeModal onClose={() => setOpen(false)} onSave={add} />}
    </div>
  )
}

function PendingIncomeModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (item: Omit<PendingIncome, 'id'>) => Promise<void>
}) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<PendingIncomeType>('salaire')
  const [amount, setAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({ label, type, amount: Number(amount), expectedDate, status: 'pending' })
      onClose()
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nouveau revenu à venir" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="pi-label">Libellé</Label>
          <Input id="pi-label" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Salaire juillet, prime…" />
        </div>
        <div>
          <Label htmlFor="pi-type">Type</Label>
          <Select id="pi-type" value={type} onChange={(e) => setType(e.target.value as PendingIncomeType)}>
            <option value="salaire">Salaire</option>
            <option value="indemnite">Indemnité</option>
            <option value="autre">Autre</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pi-amount">Montant (€)</Label>
            <Input id="pi-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pi-date">Date attendue</Label>
            <Input id="pi-date" type="date" required value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  )
}
