
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Trash2,
  Loader2,
  Receipt,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import {
  transactionsAPI,
  getAPIError,
} from '../services/api'

const CATEGORIES = [
  'Other',
  'Salary',
  'Food',
  'Housing',
  'Transport',
  'Utilities',
  'Business',
  'Shopping',
]

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = () => ({
  name: '',
  category: 'Other',
  amount: '',
  type: 'expense',
  date: today(),
})

const money = (value) =>
  `EGP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) => {
  if (!value) return '-'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const normalizeTransactions = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.transactions)) return data.transactions
  if (Array.isArray(data?.items)) return data.items
  return []
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load transactions from FastAPI
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await transactionsAPI.getAll()

      setTransactions(normalizeTransactions(response.data))
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Search and filter
  const filtered = useMemo(() => {
    return transactions.filter((item) => {
      const name = (item.name || '').toLowerCase()
      const category = (item.category || '').toLowerCase()
      const searchValue = search.toLowerCase()

      const matchesSearch =
        name.includes(searchValue) ||
        category.includes(searchValue)

      const matchesFilter =
        filter === 'all' || item.type === filter

      return matchesSearch && matchesFilter
    })
  }, [transactions, search, filter])

  // Calculate totals
  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  // Add transaction
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || Number(form.amount) <= 0) {
      setError('Please enter a valid name and amount.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        name: form.name.trim(),
        category: form.category,
        amount: Number(form.amount),
        type: form.type,
        date: form.date,
      }

      const response = await transactionsAPI.create(payload)

      const newTransaction = response.data

      if (newTransaction?.id) {
        setTransactions((current) => [
          newTransaction,
          ...current,
        ])
      } else {
        await fetchTransactions()
      }

      setForm(emptyForm())
      setShowForm(false)
      setSuccess('Transaction added successfully.')
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setSaving(false)
    }
  }

  // Delete transaction
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    )

    if (!confirmed) return

    try {
      setDeletingId(id)
      setError('')
      setSuccess('')

      await transactionsAPI.delete(id)

      setTransactions((current) =>
        current.filter((item) => item.id !== id)
      )

      setSuccess('Transaction deleted successfully.')
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Track and manage your income and expenses."
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
            Add Transaction
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

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Transactions"
          value={transactions.length}
          icon={Receipt}
        />

        <StatCard
          title="Total Income"
          value={money(income)}
          icon={ArrowDownLeft}
        />

        <StatCard
          title="Total Expenses"
          value={money(expenses)}
          icon={ArrowUpRight}
          positive={false}
        />
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d111b]">
        <div className="flex flex-col gap-3 border-b border-white/5 p-5 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 px-3">
            <Search size={17} className="text-slate-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#151b27] px-4 py-3 text-sm text-slate-300 outline-none"
          >
            <option value="all">All transactions</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
            <Loader2 size={22} className="animate-spin text-emerald-400" />
            Loading transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 rounded-2xl bg-white/5 p-4">
              <Receipt size={30} className="text-slate-500" />
            </div>

            <h3 className="font-semibold text-white">
              {transactions.length === 0
                ? 'No transactions yet'
                : 'No matching transactions'}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {transactions.length === 0
                ? 'Add your first income or expense to start tracking your finances.'
                : 'Try changing your search or transaction filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-medium">Transaction</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 text-right font-medium">Amount</th>
                  <th className="px-5 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-white">
                        {item.name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                        {item.category || 'Other'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {formatDate(item.date)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          item.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.type === 'income' ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}

                        {item.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold ${
                        item.type === 'income'
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {money(item.amount)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Delete transaction"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-white/5 px-5 py-4 text-xs text-slate-500">
          Showing {filtered.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Add Transaction Modal */}
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
            className="w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Add Transaction
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your income or expense details.
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
                Transaction name
              </label>

              <input
                required
                maxLength={200}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Monthly salary"
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Type
                </label>

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-3 py-3 text-sm text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
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
                  className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-3 py-3 text-sm text-white"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Amount (EGP)
              </label>

              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Date
              </label>

              <input
                required
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d111b] px-4 py-3 text-sm text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Transaction'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
