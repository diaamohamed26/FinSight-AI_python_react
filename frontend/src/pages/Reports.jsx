
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  FileText,
  TrendingUp,
  Wallet,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import { reportsAPI, getAPIError } from '../services/api'

// ==========================================
// Helpers
// ==========================================

const formatCurrency = (value) =>
  `EGP ${Number(value || 0).toLocaleString('en-EG', {
    maximumFractionDigits: 2,
  })}`

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDateRange = (period) => {
  const end = new Date()
  const start = new Date()

  if (period === 'This month') {
    start.setDate(1)
  } else if (period === 'Last 6 months') {
    start.setMonth(start.getMonth() - 5)
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }

  return {
    start_date: formatDate(start),
    end_date: formatDate(end),
  }
}

// ==========================================
// Component
// ==========================================

export default function Reports() {
  const [period, setPeriod] = useState('This year')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ========================================
  // Fetch Reports
  // ========================================

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = getDateRange(period)

      const response = await reportsAPI.expenses(params)

      setReport(response.data)
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // ========================================
  // Normalize Backend Data
  // ========================================

  const data = report?.data || report || {}

  const totalIncome = Number(data.total_income || 0)
  const totalExpenses = Number(data.total_expenses || 0)

  const netSavings =
    data.net_savings !== undefined
      ? Number(data.net_savings)
      : totalIncome - totalExpenses

  const rawCategories = Array.isArray(data.categories)
    ? data.categories
    : []

  const categories = useMemo(() => {
    return rawCategories.map((item) => {
      const amount = Number(item.amount || item.total || 0)

      return {
        name: item.name || item.category || 'Other',
        amount,
        percentage:
          totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0,
      }
    })
  }, [rawCategories, totalExpenses])

  const cashFlow = Array.isArray(data.cash_flow)
    ? data.cash_flow
    : []

  // ========================================
  // Export CSV
  // ========================================

  function exportReport() {
    if (!report) return

    const rows = [
      ['Financial Report'],
      ['Period', period],
      [],
      ['Financial Summary'],
      ['Metric', 'Amount (EGP)'],
      ['Total Income', totalIncome],
      ['Total Expenses', totalExpenses],
      ['Net Savings', netSavings],
      [],
      ['Expense Breakdown'],
      ['Category', 'Amount (EGP)', 'Percentage'],
      ...categories.map((item) => [
        item.name,
        item.amount,
        item.percentage.toFixed(2) + '%',
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '')
            return `"${text.replace(/"/g, '""')}"`
          })
          .join(',')
      )
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `finsight-report-${period
      .toLowerCase()
      .replaceAll(' ', '-')}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  // ========================================
  // Loading State
  // ========================================

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Financial Reports"
          description="Understand your financial performance and spending patterns."
        />

        <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
          <RefreshCw
            size={32}
            className="animate-spin text-emerald-400"
          />
          <p className="text-sm text-slate-400">
            Generating your financial report...
          </p>
        </div>
      </div>
    )
  }

  // ========================================
  // Error State
  // ========================================

  if (error) {
    return (
      <div>
        <PageHeader
          title="Financial Reports"
          description="Understand your financial performance and spending patterns."
        />

        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <AlertCircle
            size={30}
            className="mx-auto mb-3 text-red-400"
          />

          <p className="mb-4 text-sm text-red-400">
            {error}
          </p>

          <button
            onClick={fetchReport}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // Statistics
  // ========================================

  const stats = [
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: Wallet,
      color: 'text-red-400',
    },
    {
      title: 'Net Savings',
      value: formatCurrency(netSavings),
      icon: FileText,
      color: netSavings >= 0
        ? 'text-blue-400'
        : 'text-red-400',
    },
  ]

  // ========================================
  // UI
  // ========================================

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description="Understand your financial performance and spending patterns."
        action={
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-300"
          >
            <Download size={17} />
            Export CSV
          </button>
        }
      />

      {/* Period Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays
            size={18}
            className="text-slate-500"
          />

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#151b27] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
          >
            <option>This year</option>
            <option>This month</option>
            <option>Last 6 months</option>
          </select>
        </div>

        <button
          onClick={fetchReport}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5"
            >
              <div className="flex justify-between">
                <p className="text-sm text-slate-400">
                  {item.title}
                </p>

                <Icon
                  size={20}
                  className={item.color}
                />
              </div>

              <h3 className="mt-5 text-2xl font-bold text-white">
                {item.value}
              </h3>
            </div>
          )
        })}
      </div>

      {/* Income vs Expenses */}
      <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
        <h2 className="mb-2 font-semibold text-white">
          Income vs Expenses
        </h2>

        <p className="mb-6 text-xs text-slate-500">
          Financial activity for {period.toLowerCase()}
        </p>

        {cashFlow.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow}>
                <CartesianGrid
                  stroke="#ffffff10"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />

                <Tooltip
                  contentStyle={{
                    background: '#151b27',
                    border: '1px solid #ffffff15',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#34d399"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f87171"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            No cash flow chart data available for this period.
          </div>
        )}
      </div>

      {/* Expense Breakdown */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
        <h2 className="mb-5 font-semibold text-white">
          Expense Breakdown
        </h2>

        {categories.length > 0 ? (
          <div className="space-y-5">
            {categories.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-300">
                    {item.name}
                  </span>

                  <span className="text-slate-400">
                    {formatCurrency(item.amount)} ·{' '}
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                    }}
                    className="h-full rounded-full bg-emerald-400 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">
            No expense categories found for this period.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Reports are calculated from transactions stored in your FinSight database.
      </p>
    </div>
  )
}
