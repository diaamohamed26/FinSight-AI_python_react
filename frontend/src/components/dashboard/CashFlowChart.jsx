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

const data = [
  { month: 'Jan', income: 65000, expenses: 35000 },
  { month: 'Feb', income: 80000, expenses: 45000 },
  { month: 'Mar', income: 55000, expenses: 30000 },
  { month: 'Apr', income: 90000, expenses: 50000 },
  { month: 'May', income: 70000, expenses: 38000 },
  { month: 'Jun', income: 100000, expenses: 55000 },
  { month: 'Jul', income: 75000, expenses: 42000 },
  { month: 'Aug', income: 85000, expenses: 48000 },
  { month: 'Sep', income: 65000, expenses: 32000 },
  { month: 'Oct', income: 95000, expenses: 52000 },
  { month: 'Nov', income: 80000, expenses: 40000 },
  { month: 'Dec', income: 90000, expenses: 45000 },
]

export default function CashFlowChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
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
              borderRadius: '12px',
              color: '#fff',
            }}
            formatter={(value) => `EGP ${Number(value).toLocaleString()}`}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#34d399" radius={[5, 5, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#475569" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}