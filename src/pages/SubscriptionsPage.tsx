import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { Category, Subscription, SubscriptionFrequency } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency, formatDate, todayISO } from '../lib/format'

export function SubscriptionsPage() {
  const { data: subscriptions, add, update, remove } = useCollection<Subscription>('subscriptions')
  const { data: categories } = useCollection<Category>('categories')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const active = subscriptions.filter((s) => s.active)
  const monthlyTotal = active.reduce(
    (sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12),
    0,
  )
  const annualTotal = active.reduce(
    (sum, s) => sum + (s.frequency === 'annual' ? s.amount : s.amount * 12),
    0,
  )

  const sorted = [...subscriptions].sort(
    (a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime(),
  )

  return (
    <div>
      <PageHeader
        title="Abonnements"
        description="Tous tes abonnements mensuels et annuels, au même endroit."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvel abonnement
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Coût mensuel équivalent" value={formatCurrency(monthlyTotal)} />
        <StatCard label="Coût annuel équivalent" value={formatCurrency(annualTotal)} />
        <StatCard label="Abonnements actifs" value={String(active.length)} />
      </div>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState icon={<Repeat size={28} />} title="Aucun abonnement" description="Ajoute Netflix, ton loyer, ta salle de sport…" />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((s) => {
              const cat = categoryMap.get(s.categoryId)
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                    />
                    <div>
                      <p className={`text-sm font-medium ${s.active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 line-through'}`}>
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.frequency === 'monthly' ? 'Mensuel' : 'Annuel'} · prochain prélèvement {formatDate(s.nextBillingDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatCurrency(s.amount)}
                    </span>
                    <button
                      onClick={() => update(s.id, { active: !s.active })}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                    >
                      {s.active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => setEditing(s)}
                      className="text-slate-300 hover:text-emerald-500 dark:text-slate-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer « ${s.name} » ?`)) remove(s.id)
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

      {open && (
        <SubscriptionModal categories={categories} onClose={() => setOpen(false)} onSave={add} />
      )}
      {editing && (
        <SubscriptionModal
          categories={categories}
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

function SubscriptionModal({
  categories,
  initial,
  onClose,
  onSave,
}: {
  categories: Category[]
  initial?: Subscription
  onClose: () => void
  onSave: (item: Omit<Subscription, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(initial?.frequency ?? 'monthly')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [nextBillingDate, setNextBillingDate] = useState(initial?.nextBillingDate ?? todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        name,
        amount: Number(amount),
        frequency,
        categoryId: categoryId || expenseCategories[0]?.id || '',
        nextBillingDate,
        active: initial?.active ?? true,
      })
      onClose()
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? "Modifier l'abonnement" : 'Nouvel abonnement'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="sub-name">Nom</Label>
          <Input id="sub-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, loyer…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sub-amount">Montant (€)</Label>
            <Input id="sub-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sub-freq">Fréquence</Label>
            <Select id="sub-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}>
              <option value="monthly">Mensuel</option>
              <option value="annual">Annuel</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="sub-date">Prochain prélèvement</Label>
          <Input id="sub-date" type="date" required value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sub-cat">Catégorie</Label>
          <Select id="sub-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  )
}
