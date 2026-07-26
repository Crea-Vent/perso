import type { ReactNode } from 'react'

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-800">
      {icon && <div className="mb-3 text-slate-300 dark:text-slate-600">{icon}</div>}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">{description}</p>
      )}
    </div>
  )
}
