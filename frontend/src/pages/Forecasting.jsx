
import { useCallback, useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  TrendingUp,
  CalendarDays,
  Sparkles,
  RefreshCw,
  Wallet,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import { forecastAPI, getAPIError } from '../services/api'

const formatCurrency = (value) =>
  `EGP ${Number(value || 0).toLocaleString('en-EG', {
    maximumFractionDigits: 2,
  })}`

export default function Forecasting() {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await forecastAPI.get()

      setForecast(response.data)
    } catch (err) {
      setError(getAPIError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  const currentBalance = Number(
    forecast?.current_balance || 0
  )

  const monthlySavings = Number(
    forecast?.monthly_savings || 0
  )

  const projections = forecast?.projections || []

  const projectedBalance = projections.length
    ? Number(
        projections[projections.length - 1].projected_balance
      )
    : currentBalance

  const growth =
    currentBalance > 0
      ? ((projectedBalance - currentBalance) / currentBalance) * 100
      : 0

  const chartData = [
    {
      month: 'Current',
      actual: currentBalance,
      forecast: currentBalance,
    },
    ...projections.map((item) => ({
      month: item.month,
      actual: null,
      forecast: Number(item.projected_balance),
    })),
  ]

  const stats = [
    {
      title: 'Current Balance',
      value: formatCurrency(currentBalance),
      icon: Wallet,
      color: 'text-blue-400',
    },
    {
      title: 'Projected Balance',
      value: formatCurrency(projectedBalance),
      icon: CalendarDays,
      color: 'text-emerald-400',
    },
    {
      title: 'Expected Growth',
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      icon: Sparkles,
      color: 'text-purple-400',
    },
  ]

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Financial Forecasting"
          description="Explore possible future cash flow based on your financial data."
        />

        <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
          <RefreshCw
            className="animate-spin text-emerald-400"
            size={32}
          />
          <p className="text-sm text-slate-400">
            Analyzing your financial data...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Financial Forecasting"
          description="Explore possible future cash flow based on your financial data."
        />

        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <p className="mb-4 text-sm text-red-400">
            {error}
          </p>

          <button
            onClick={fetchForecast}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Financial Forecasting"
        description="Explore possible future cash flow based on your financial data."
      />

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

                <Icon size={20} className={item.color} />
              </div>

              <h3 className="mt-5 text-2xl font-bold text-white">
                {item.value}
              </h3>
            </div>
          )
        })}
      </div>

      {/* Forecast Chart */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">
              Balance Projection
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Based on your transaction history
            </p>
          </div>

          <button
            onClick={fetchForecast}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {projections.length > 0 ? (
          <div className="mt-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="forecastFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#34d399"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#34d399"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

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
                  tickFormatter={(value) =>
                    `${(value / 1000).toFixed(0)}k`
                  }
                />

                <Tooltip
                  contentStyle={{
                    background: '#151b27',
                    border: '1px solid #ffffff15',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  formatter={(value) =>
                    value == null ? '—' : formatCurrency(value)
                  }
                />

                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Projected Balance"
                  stroke="#34d399"
                  strokeWidth={3}
                  fill="url(#forecastFill)"
                />

                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Balance"
                  stroke="#64748b"
                  strokeWidth={3}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Not enough forecast data available yet.
          </div>
        )}

        {/* AI Insights */}
        <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles size={18} />
            <span className="text-sm font-semibold">
              Forecasting Insights
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {monthlySavings > 0
              ? `Your monthly net savings are ${formatCurrency(monthlySavings)}. Your projected balance is ${formatCurrency(projectedBalance)}.`
              : monthlySavings < 0
                ? `Your monthly cash flow is negative (${formatCurrency(Math.abs(monthlySavings))}). Consider reviewing your expenses.`
                : 'Add more transactions to generate meaningful financial projections.'}
          </p>
        </div>
      </div>
    </div>
  )
}
