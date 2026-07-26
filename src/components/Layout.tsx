import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  TrendingUp,
  PiggyBank,
  Tags,
  Clock,
  LogOut,
  Wallet2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/abonnements', label: 'Abonnements', icon: Repeat },
  { to: '/investissements', label: 'Investissements', icon: TrendingUp },
  { to: '/epargne', label: 'Épargne', icon: PiggyBank },
  { to: '/a-venir', label: 'À venir', icon: Clock },
  { to: '/categories', label: 'Catégories', icon: Tags },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
            <Wallet2 size={18} />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Mon budget
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="truncate px-2 text-xs text-slate-400" title={user?.email ?? ''}>
            {user?.email}
          </p>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 px-1 py-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="min-w-0 flex-1 p-4 pb-20 sm:p-8 sm:pb-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
