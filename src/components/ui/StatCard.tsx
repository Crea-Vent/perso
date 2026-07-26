import type { ReactNode } from 'react'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  hint,
}: {
  label: string
  value: string
  icon?: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  hint?: string
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-slate-100'

  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
      {icon && (
        <div className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {icon}
        </div>
      )}
    </Card>
  )
}
