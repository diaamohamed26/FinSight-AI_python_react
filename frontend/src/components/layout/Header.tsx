
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const pageInfo = {
  '/': ['Dashboard', 'Your financial overview at a glance'],
  '/transactions': ['Transactions', 'Manage your income and expenses'],
  '/budgets': ['Budgets', 'Plan and manage your spending'],
  '/forecasting': ['Forecasting', 'Explore your financial future'],
  '/reports': ['Reports', 'Understand your financial performance'],
  '/ai-assistant': ['AI Assistant', 'Get intelligent financial insights'],
  '/settings': ['Settings', 'Manage your account and preferences'],
}

const getInitials = (name = 'User') =>
  name.trim().split(/\s+/).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '').join('')

export default function Header({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [title, subtitle] = pageInfo[location.pathname] || [
    'FinSight AI',
    'Financial Intelligence Platform',
  ]

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#080b12]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white">{title}</h2>
          <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
          <Search size={17} className="text-slate-500" />
          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
            ⌘ K
          </kbd>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#080b12]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/5 sm:gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 text-sm font-bold text-[#07110c]">
              {getInitials(user?.name)}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="max-w-32 truncate text-xs text-slate-500">
                {user?.email || ''}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-500 transition sm:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111722] shadow-2xl">
                <div className="border-b border-white/5 p-4">
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <User size={17} />
                    My Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Settings size={17} />
                    Settings
                  </button>

                  <div className="my-2 border-t border-white/5" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-400/10"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
