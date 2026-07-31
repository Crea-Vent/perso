import { useState, type FormEvent } from 'react'
import { Plus, TrendingUp, Trash2 } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { Investment } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency, formatDate, todayISO } from '../lib/format'

export function InvestmentsPage() {
  const { data: investments, add, remove } = useCollection<Investment>('investments')
  const [open, setOpen] = useState(false)

  const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0)
  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0)
  const gain = totalValue - totalInvested
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0

  return (
    <div>
      <PageHeader
        title="Investissements"
        description="Actions, crypto, immobilier, PEA… suis la performance de ton portefeuille."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvel investissement
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total investi" value={formatCurrency(totalInvested)} />
        <StatCard label="Valeur actuelle" value={formatCurrency(totalValue)} />
        <StatCard
          label="Plus/moins-value"
          value={`${formatCurrency(gain)} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}%)`}
          tone={gain >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card>
        {investments.length === 0 ? (
          <EmptyState icon={<TrendingUp size={28} />} title="Aucun investissement" description="Ajoute tes placements pour suivre leur évolution." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {investments.map((inv) => {
              const g = inv.currentValue - inv.amountInvested
              const pct = inv.amountInvested > 0 ? (g / inv.amountInvested) * 100 : 0
              return (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{inv.name}</p>
                    <p className="text-xs text-slate-400">
                      {inv.kind} · investi {formatCurrency(inv.amountInvested)} · {formatDate(inv.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(inv.currentValue)}
                      </p>
                      <p className={`text-xs font-medium ${g >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {g >= 0 ? '+' : ''}
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer « ${inv.name} » ?`)) remove(inv.id)
                      }}
                      className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {open && <InvestmentModal onClose={() => setOpen(false)} onSave={add} />}
    </div>
  )
}

function InvestmentModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (item: Omit<Investment, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [amountInvested, setAmountInvested] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        name,
        kind,
        amountInvested: Number(amountInvested),
        currentValue: Number(currentValue || amountInvested),
        date,
      })
      onClose()
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nouvel investissement" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="inv-name">Nom</Label>
          <Input id="inv-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="PEA, Bitcoin, Appartement…" />
        </div>
        <div>
          <Label htmlFor="inv-kind">Type</Label>
          <Input id="inv-kind" required value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Actions, Crypto, Immobilier…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="inv-invested">Montant investi (€)</Label>
            <Input id="inv-invested" type="number" min="0" step="0.01" required value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="inv-value">Valeur actuelle (€)</Label>
            <Input id="inv-value" type="number" min="0" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder={amountInvested || '0'} />
          </div>
        </div>
        <div>
          <Label htmlFor="inv-date">Date</Label>
          <Input id="inv-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  )
}
