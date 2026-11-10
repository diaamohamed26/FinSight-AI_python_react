import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d111b] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        {Icon && (
          <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-400">
            <Icon size={20} />
          </div>
        )}
      </div>

      <h3 className="mt-5 text-2xl font-bold text-white">{value}</h3>

      {change && (
        <p className={`mt-3 flex items-center gap-1 text-xs ${
          positive ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
          <span className="text-slate-500">vs last month</span>
        </p>
      )}
    </div>
  )
}