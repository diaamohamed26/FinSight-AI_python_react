
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import { dashboardAPI, transactionsAPI } from '../services/api'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const getList = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.transactions)) return response.transactions
  if (Array.isArray(response?.data)) return response.data

  return []
}

const getNumber = (object, keys, fallback = 0) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return Number(object[key]) || 0
    }
  }

  return fallback
}

const isIncome = (transaction) =>
  String(transaction.type).toLowerCase() === 'income'

export default function Dashboard() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const [dashboardResponse, transactionsResponse] =
        await Promise.all([
          dashboardAPI.get(),
          transactionsAPI.getAll(),
        ])

      setDashboard(dashboardResponse.data || {})

      setTransactions(getList(transactionsResponse.data))
    } catch (err) {
      console.error('Dashboard error:', err)

      setError(
        err.response?.data?.detail ||
        'Unable to load your financial data. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const financialTotals = useMemo(() => {
    const income = transactions
      .filter(isIncome)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const expenses = transactions
      .filter((item) => !isIncome(item))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      income,
      expenses,
      savings: income - expenses,
    }
  }, [transactions])

  const stats = useMemo(() => {
    const income = getNumber(
      dashboard,
      ['total_income', 'income'],
      financialTotals.income,
    )

    const expenses = getNumber(
      dashboard,
      ['total_expenses', 'expenses'],
      financialTotals.expenses,
    )

    const savings = getNumber(
      dashboard,
      ['total_savings', 'savings'],
      income - expenses,
    )

    const balance = getNumber(
      dashboard,
      ['total_balance', 'current_balance', 'balance'],
      savings,
    )

    return [
      {
        title: 'Total Balance',
        value: formatCurrency(balance),
        icon: Wallet,
      },
      {
        title: 'Total Income',
        value: formatCurrency(income),
        icon: TrendingUp,
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(expenses),
        icon: CreditCard,
      },
      {
        title: 'Total Savings',
        value: formatCurrency(savings),
        icon: PiggyBank,
      },
    ]
  }, [dashboard, financialTotals])

  const monthlyCashFlow = useMemo(() => {
    const currentYear = new Date().getFullYear()

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(currentYear, index, 1).toLocaleDateString(
        'en-US',
        { month: 'short' },
      ),
      income: 0,
      expense: 0,
    }))

    transactions.forEach((transaction) => {
      if (!transaction.date) return

      const date = new Date(transaction.date)

      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== currentYear
      ) {
        return
      }

      const month = date.getMonth()
      const amount = Number(transaction.amount) || 0

      if (isIncome(transaction)) {
        months[month].income += amount
      } else {
        months[month].expense += amount
      }
    })

    const maxValue = Math.max(
      ...months.map((item) =>
        Math.max(item.income, item.expense),
      ),
      1,
    )

    return months.map((item) => ({
      ...item,
      incomeHeight: (item.income / maxValue) * 100,
      expenseHeight: (item.expense / maxValue) * 100,
    }))
  }, [transactions])

  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    )

    return sorted.slice(0, 5)
  }, [transactions])

  const totals = {
    income: stats[1]?.value,
    expenses: stats[2]?.value,
    savings: stats[3]?.value,
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-emerald-400" size={30} />
          <p className="mt-4 text-sm text-slate-400">
            Loading your financial dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-[#0d111b] p-8 text-center">
        <p className="text-red-400">{error}</p>

        <button
          onClick={fetchDashboard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#07110c]"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Financial Dashboard 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your finances.
          </p>
        </div>

        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5 transition hover:border-emerald-400/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {stat.title}
                </span>

                <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-400">
                  <Icon size={19} />
                </div>
              </div>

              <h3 className="mt-5 break-words text-2xl font-bold tracking-tight text-white">
                {stat.value}
              </h3>

              <p className="mt-3 text-xs text-slate-500">
                Based on your recorded transactions
              </p>
            </div>
          )
        })}
      </section>

      {/* Cash Flow and AI Insight */}
      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">
                Cash Flow
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Income vs expenses — {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <div className="mt-8 flex h-56 items-end justify-between gap-2 sm:gap-3">
            {monthlyCashFlow.map((item) => (
              <div
                key={item.month}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
              >
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    title={`Income: ${formatCurrency(item.income)}`}
                    style={{ height: `${item.incomeHeight}%` }}
                    className="w-2 rounded-t-md bg-emerald-400 sm:w-4"
                  />

                  <div
                    title={`Expenses: ${formatCurrency(item.expense)}`}
                    style={{ height: `${item.expenseHeight}%` }}
                    className="w-2 rounded-t-md bg-slate-700 sm:w-4"
                  />
                </div>

                <span className="text-[9px] text-slate-500 sm:text-[10px]">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-5 border-t border-white/5 pt-4">
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Income
            </span>

            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Expenses
            </span>
          </div>
        </div>

        {/* Financial Insight */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={19} />
            <h3 className="font-semibold text-white">
              Financial Overview
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Based on your recorded financial activity
          </p>

          <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              {financialTotals.savings >= 0 ? (
                <ArrowUpRight size={18} />
              ) : (
                <ArrowDownRight size={18} />
              )}

              <span className="text-sm font-semibold">
                {financialTotals.savings >= 0
                  ? 'Positive Cash Flow'
                  : 'Negative Cash Flow'}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Your recorded income is {totals.income} and your
              recorded expenses are {totals.expenses}.
              Your calculated savings are {totals.savings}.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500">
              Suggested action
            </p>

            <p className="mt-2 text-sm text-white">
              Review your transactions and budgets regularly to
              understand your spending habits.
            </p>
          </div>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="mt-5 w-full rounded-xl border border-emerald-400/20 py-3 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/10"
          >
            Ask AI Assistant
          </button>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d111b]">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div>
            <h3 className="font-semibold text-white">
              Recent Transactions
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Your latest financial activity
            </p>
          </div>

          <button
            onClick={() => navigate('/transactions')}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="px-5 py-4 font-medium">
                  TRANSACTION
                </th>
                <th className="px-5 py-4 font-medium">
                  CATEGORY
                </th>
                <th className="px-5 py-4 font-medium">
                  DATE
                </th>
                <th className="px-5 py-4 text-right font-medium">
                  AMOUNT
                </th>
                <th className="px-5 py-4" />
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-t border-white/5 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-white">
                      {transaction.name}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {transaction.category || 'Other'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(transaction.date)}
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold ${
                        isIncome(transaction)
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {isIncome(transaction) ? '+' : '-'}{' '}
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate('/transactions')}
                        aria-label="View transactions"
                        className="text-slate-500 hover:text-white"
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No transactions yet. Add your first transaction
                    to see your financial activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
