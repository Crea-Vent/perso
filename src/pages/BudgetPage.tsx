import { useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus, Receipt, Trash2 } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { Category, CategoryType, Transaction } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency, formatDate, todayISO, MONTH_LABELS } from '../lib/format'

export function BudgetPage() {
  const { data: transactions, add, remove } = useCollection<Transaction>('transactions', 'date')
  const { data: categories } = useCollection<Category>('categories')
  const [view, setView] = useState<'month' | 'year'>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [open, setOpen] = useState(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const monthTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() === month
      }),
    [transactions, year, month],
  )

  const yearTx = useMemo(
    () => transactions.filter((t) => new Date(t.date).getFullYear() === year),
    [transactions, year],
  )

  function sums(list: Transaction[]) {
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }

  const monthSums = sums(monthTx)
  const yearSums = sums(yearTx)

  const monthlyBreakdown = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const list = yearTx.filter((t) => new Date(t.date).getMonth() === m)
      return { month: m, ...sums(list) }
    })
  }, [yearTx])

  function shift(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev)
      if (view === 'month') next.setMonth(next.getMonth() + delta)
      else next.setFullYear(next.getFullYear() + delta)
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="Budget"
        description="Suis tes revenus et dépenses, mois par mois ou sur l'année."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Ajouter
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setView('month')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === 'month' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setView('year')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === 'year' ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
          >
            Annuel
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-36 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
            {view === 'month' ? `${MONTH_LABELS[month]} ${year}` : year}
          </span>
          <button
            onClick={() => shift(1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenus" value={formatCurrency(view === 'month' ? monthSums.income : yearSums.income)} tone="positive" />
        <StatCard label="Dépenses" value={formatCurrency(view === 'month' ? monthSums.expense : yearSums.expense)} tone="negative" />
        <StatCard
          label="Solde"
          value={formatCurrency(view === 'month' ? monthSums.balance : yearSums.balance)}
          tone={(view === 'month' ? monthSums.balance : yearSums.balance) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {view === 'month' ? (
        <Card>
          {monthTx.length === 0 ? (
            <EmptyState icon={<Receipt size={28} />} title="Aucune opération ce mois-ci" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {monthTx.map((t) => {
                const cat = categoryMap.get(t.categoryId)
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {t.description || cat?.name || 'Opération'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {cat?.name ?? '—'} · {formatDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => remove(t.id)}
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
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Mois</th>
                <th className="pb-2 font-medium">Revenus</th>
                <th className="pb-2 font-medium">Dépenses</th>
                <th className="pb-2 font-medium">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyBreakdown.map((row) => (
                <tr key={row.month}>
                  <td className="py-2 text-slate-700 dark:text-slate-200">{MONTH_LABELS[row.month]}</td>
                  <td className="py-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(row.income)}</td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">{formatCurrency(row.expense)}</td>
                  <td className={`py-2 font-medium ${row.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {open && (
        <TransactionModal categories={categories} onClose={() => setOpen(false)} onSave={add} />
      )}
    </div>
  )
}

function TransactionModal({
  categories,
  onClose,
  onSave,
}: {
  categories: Category[]
  onClose: () => void
  onSave: (item: Omit<Transaction, 'id'>) => Promise<void>
}) {
  const [type, setType] = useState<CategoryType>('expense')
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = categories.filter((c) => c.type === type)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      type,
      date,
      amount: Number(amount),
      categoryId: categoryId || filtered[0]?.id || '',
      description,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title="Nouvelle opération" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['expense', 'income'] as CategoryType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${type === t ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
            >
              {t === 'expense' ? 'Dépense' : 'Revenu'}
            </button>
          ))}
        </div>
        <div>
          <Label htmlFor="tx-desc">Description</Label>
          <Input id="tx-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Courses, loyer, salaire…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tx-amount">Montant (€)</Label>
            <Input id="tx-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tx-date">Date</Label>
            <Input id="tx-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="tx-cat">Catégorie</Label>
          <Select id="tx-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  )
}
