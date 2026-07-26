import { useState, type FormEvent } from 'react'
import { PiggyBank, Plus, Trash2, Pencil } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { SavingsAccount } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency } from '../lib/format'

export function SavingsPage() {
  const { data: savings, add, update, remove } = useCollection<SavingsAccount>('savings')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsAccount | null>(null)

  const total = savings.reduce((s, a) => s + a.amount, 0)

  return (
    <div>
      <PageHeader
        title="Épargne"
        description="Tous tes comptes et objectifs d'épargne."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouveau compte
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Épargne totale" value={formatCurrency(total)} tone="positive" />
        <StatCard label="Comptes" value={String(savings.length)} />
      </div>

      {savings.length === 0 ? (
        <Card>
          <EmptyState icon={<PiggyBank size={28} />} title="Aucun compte d'épargne" description="Ajoute ton livret A, ton fonds d'urgence…" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savings.map((a) => {
            const pct = a.targetAmount ? Math.min(100, (a.amount / a.targetAmount) * 100) : null
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.name}</p>
                    {a.note && <p className="text-xs text-slate-400">{a.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(a)} className="text-slate-300 hover:text-emerald-500 dark:text-slate-600">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer « ${a.name} » ?`)) remove(a.id)
                      }}
                      className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(a.amount)}
                </p>
                {pct !== null && (
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {pct.toFixed(0)}% de l'objectif ({formatCurrency(a.targetAmount!)})
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {open && <SavingsModal onClose={() => setOpen(false)} onSave={add} />}
      {editing && (
        <SavingsModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (item) => {
            await update(editing.id, item)
          }}
        />
      )}
    </div>
  )
}

function SavingsModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: SavingsAccount
  onClose: () => void
  onSave: (item: Omit<SavingsAccount, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(String(initial?.amount ?? ''))
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount ? String(initial.targetAmount) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      amount: Number(amount),
      targetAmount: targetAmount ? Number(targetAmount) : undefined,
      note: note || undefined,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={initial ? 'Modifier le compte' : 'Nouveau compte'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="sav-name">Nom</Label>
          <Input id="sav-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Livret A, Fonds d'urgence…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sav-amount">Montant actuel (€)</Label>
            <Input id="sav-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sav-target">Objectif (€)</Label>
            <Input id="sav-target" type="number" min="0" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Optionnel" />
          </div>
        </div>
        <div>
          <Label htmlFor="sav-note">Note</Label>
          <Input id="sav-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" />
        </div>
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </Modal>
  )
}
