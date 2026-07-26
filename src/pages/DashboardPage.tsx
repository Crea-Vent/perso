import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Wallet, PiggyBank, TrendingUp, Repeat } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { Investment, PendingIncome, SavingsAccount, Subscription, Transaction } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatDate, MONTH_LABELS_SHORT } from '../lib/format'

export function DashboardPage() {
  const { data: transactions } = useCollection<Transaction>('transactions')
  const { data: subscriptions } = useCollection<Subscription>('subscriptions')
  const { data: investments } = useCollection<Investment>('investments')
  const { data: savings } = useCollection<SavingsAccount>('savings')
  const { data: pending } = useCollection<PendingIncome>('pendingIncome')

  const now = useMemo(() => new Date(), [])
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthBalance = monthIncome - monthExpense

  const totalSavings = savings.reduce((s, a) => s + a.amount, 0)
  const totalInvestValue = investments.reduce((s, i) => s + i.currentValue, 0)
  const monthlySubs = subscriptions
    .filter((s) => s.active)
    .reduce((s, sub) => s + (sub.frequency === 'monthly' ? sub.amount : sub.amount / 12), 0)

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const list = transactions.filter((t) => {
        const td = new Date(t.date)
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
      })
      return {
        name: MONTH_LABELS_SHORT[d.getMonth()],
        Revenus: list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Dépenses: list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions, now])

  const upcomingSubs = [...subscriptions]
    .filter((s) => s.active)
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 4)

  const upcomingIncome = [...pending]
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
    .slice(0, 4)

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de tes finances." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Solde du mois"
          value={formatCurrency(monthBalance)}
          icon={<Wallet size={18} />}
          tone={monthBalance >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Épargne totale" value={formatCurrency(totalSavings)} icon={<PiggyBank size={18} />} />
        <StatCard label="Investissements" value={formatCurrency(totalInvestValue)} icon={<TrendingUp size={18} />} />
        <StatCard label="Abonnements / mois" value={formatCurrency(monthlySubs)} icon={<Repeat size={18} />} />
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Revenus vs Dépenses (6 derniers mois)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Prochains abonnements
          </h2>
          {upcomingSubs.length === 0 ? (
            <EmptyState title="Rien de prévu" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingSubs.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{s.name}</span>
                  <span className="text-slate-400">{formatDate(s.nextBillingDate)}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Revenus à venir</h2>
          {upcomingIncome.length === 0 ? (
            <EmptyState title="Rien en attente" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingIncome.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{p.label}</span>
                  <span className="text-slate-400">{formatDate(p.expectedDate)}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
