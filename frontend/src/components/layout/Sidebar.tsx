
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  FileText,
  Bot,
  Settings,
  CircleHelp,
  ChartNoAxesCombined,
  X,
  LogOut,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const navigation = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
      { name: 'Budgets', path: '/budgets', icon: Wallet },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
      { name: 'Reports', path: '/reports', icon: FileText },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
    ],
  },
]

const getInitials = (name = 'User') =>
  name.trim().split(/\s+/).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '').join('')

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-[#0d111b] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/5 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[#08110d]">
              <ChartNoAxesCombined size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                FinSight<span className="text-emerald-400"> AI</span>
              </h1>
              <p className="text-[10px] tracking-[2px] text-slate-500">
                FINANCIAL INTELLIGENCE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={19} />
                      {item.name}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-1 border-t border-white/5 p-4">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                isActive
                  ? 'bg-emerald-400/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Settings size={19} />
            Settings
          </NavLink>

          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/settings')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <CircleHelp size={19} />
            Help & Support
          </button>

          {/* User Profile */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-400">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || 'Personal Account'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-400/10"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
