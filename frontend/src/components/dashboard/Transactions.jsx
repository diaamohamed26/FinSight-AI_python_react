import { MoreHorizontal } from 'lucide-react'

export default function Transactions({ transactions = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="px-5 py-4 font-medium">TRANSACTION</th>
            <th className="px-5 py-4 font-medium">CATEGORY</th>
            <th className="px-5 py-4 font-medium">DATE</th>
            <th className="px-5 py-4 text-right font-medium">AMOUNT</th>
            <th className="px-5 py-4" />
          </tr>
        </thead>

        <tbody>
          {transactions.map((item) => (
            <tr key={item.id} className="border-t border-white/5 hover:bg-white/[0.02]">
              <td className="px-5 py-4 text-sm font-medium text-white">{item.name}</td>
              <td className="px-5 py-4 text-sm text-slate-400">{item.category}</td>
              <td className="px-5 py-4 text-sm text-slate-500">{item.date}</td>
              <td className={`px-5 py-4 text-right text-sm font-semibold ${
                item.type === 'income' ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {item.type === 'income' ? '+' : '-'} EGP {Number(item.amount).toLocaleString()}
              </td>
              <td className="px-5 py-4 text-right text-slate-500">
                <MoreHorizontal size={19} />
              </td>
            </tr>
          ))}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}