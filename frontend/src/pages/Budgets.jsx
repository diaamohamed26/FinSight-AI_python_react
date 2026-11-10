
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  HeartPulse,
  X,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Wallet,
  TrendingDown,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import {
  budgetsAPI,
  transactionsAPI,
  getAPIError,
} from '../services/api'

const CATEGORY_ICONS = {
  Housing: Home,
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Utilities: Wallet,
  Other: ShoppingBag,
}

const CATEGORIES = [
  'Other',
  'Housing',
  'Food',
  'Transport',
  'Shopping',
  'Health',
  'Utilities',
]

const money = (value) =>
  `EGP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const emptyForm = () => ({
  name: '',
  limit: '',
  category: 'Other',
})

const normalizeList = (data, key) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  if (Array.isArray(data?.items)) return data.items
  return []
}

// Local current month: YYYY-MM
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load budgets and transactions
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [budgetResponse, transactionResponse] =
        await Promise.all([
          budgetsAPI.getAll(),
          transactionsAPI.getAll(),
        ])

      setBudgets(
        normalizeList(budgetResponse.data, 'budgets')
      )

      setTransactions(
        normalizeList(transactionResponse.data, 'transactions')
      )
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate current month's expense for each category
  const budgetsWithSpent = useMemo(() => {
    const currentMonth = getCurrentMonth()

    return budgets.map((budget) => {
      const spent = transactions
        .filter((transaction) => {
          return (
            transaction.type === 'expense' &&
            transaction.category === budget.category &&
            String(transaction.date || '').slice(0, 7) === currentMonth
          )
        })
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount || 0),
          0
        )

      const limit = Number(budget.limit || 0)
      const percentage =
        limit > 0 ? (spent / limit) * 100 : 0

      return {
        ...budget,
        spent,
        remaining: limit - spent,
        percentage,
        exceeded: spent > limit,
        Icon: CATEGORY_ICONS[budget.category] || ShoppingBag,
      }
    })
  }, [budgets, transactions])

  // Summary calculations
  const totalLimit = budgetsWithSpent.reduce(
    (sum, item) => sum + Number(item.limit || 0),
    0
  )

  const totalSpent = budgetsWithSpent.reduce(
    (sum, item) => sum + item.spent,
    0
  )

  const remaining = totalLimit - totalSpent

  const exceededCount = budgetsWithSpent.filter(
    (item) => item.exceeded
  ).length

  // Create budget
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || Number(form.limit) <= 0) {
      setError('Please enter a valid budget name and limit.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        name: form.name.trim(),
        category: form.category,
        limit: Number(form.limit),
      }

      const response = await budgetsAPI.create(payload)

      if (response.data?.id) {
        setBudgets((current) => [
          ...current,
          response.data,
        ])
      } else {
        await fetchData()
      }

      setForm(emptyForm())
      setShowForm(false)
      setSuccess('Budget created successfully.')
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setSaving(false)
    }
  }

  // Delete budget
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this budget?'
    )

    if (!confirmed) return

    try {
      setDeletingId(id)
      setError('')
      setSuccess('')

      await budgetsAPI.delete(id)

      setBudgets((current) =>
        current.filter((budget) => budget.id !== id)
      )

      setSuccess('Budget deleted successfully.')
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Set spending limits and stay in control of your money."
        action={
          <button
            onClick={() => {
              setError('')
              setSuccess('')
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300"
          >
            <Plus size={18} />
            Create Budget
          </button>
        }
      />

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {success}
          <button onClick={() => setSuccess('')}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Budget</p>
            <Wallet size={19} className="text-emerald-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {money(totalLimit)}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            {budgets.length} active budgets
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Spent</p>
            <TrendingDown size={19} className="text-rose-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {money(totalSpent)}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Current month expenses
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Remaining</p>
            <Wallet size={19} className="text-emerald-400" />
          </div>

          <h2 className={`mt-3 text-2xl font-bold ${
            remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {money(remaining)}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Budget limit minus spending
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Over Budget</p>
            <AlertCircle size={19} className="text-rose-400" />
          </div>

          <h2 className="mt-3 text-2xl font-bold text-rose-400">
            {exceededCount}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Categories exceeding their limits
          </p>
        </div>
      </div>

      {/* Budget cards header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Your Budgets
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Spending progress for the current month
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
          <Loader2
            size={22}
            className="animate-spin text-emerald-400"
          />
          Loading budgets...
        </div>
      ) : budgetsWithSpent.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0d111b] px-5 text-center">
          <div className="mb-4 rounded-2xl bg-white/5 p-4">
            <Wallet size={30} className="text-slate-500" />
          </div>

          <h3 className="font-semibold text-white">
            No budgets yet
          </h3>

          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Create your first budget to start managing your monthly spending.
          </p>

          <button
            onClick={() => setShowForm(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#07110c]"
          >
            <Plus size={17} />
            Create Budget
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgetsWithSpent.map((budget) => {
            const Icon = budget.Icon
            const percentage = budget.percentage
            const exceeded = budget.exceeded
            const progress = Math.min(percentage, 100)

            return (
              <div
                key={budget.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5 transition hover:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">
                        {budget.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {budget.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        exceeded
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {Math.round(percentage)}%
                    </span>

                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      title="Delete budget"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                    >
                      {deletingId === budget.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-7 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      Spent this month
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {money(budget.spent)}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    of {money(budget.limit)}
                  </p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      exceeded ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className={`text-xs ${
                    exceeded ? 'text-rose-400' : 'text-slate-500'
                  }`}>
                    {exceeded
                      ? `Over budget by ${money(Math.abs(budget.remaining))}`
                      : `${money(budget.remaining)} remaining`}
                  </p>

                  {exceeded && (
                    <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-400">
                      LIMIT EXCEEDED
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false)
            }
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Create Budget
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set a monthly spending limit.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="text-slate-400 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Budget name
              </label>

              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Monthly Housing"
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Category
              </label>

              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Monthly limit (EGP)
              </label>

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.limit}
                onChange={(event) =>
                  setForm({ ...form, limit: event.target.value })
                }
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Budget'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
