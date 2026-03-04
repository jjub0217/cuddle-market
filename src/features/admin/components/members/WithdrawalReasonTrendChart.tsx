'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { WiTH_DRAW_REASON } from '@/constants/constants'
import type { MonthlyWithdrawalReasonStat } from '@/features/admin/mocks/mockMemberStats'

const REASON_COLORS: Record<string, string> = {
  SERVICE_DISSATISFACTION: '#ef4444',
  PRIVACY_CONCERN: '#3b82f6',
  LOW_USAGE: '#f59e0b',
  COMPETITOR: '#8b5cf6',
  OTHER: '#6b7280',
}

const REASON_BARS = WiTH_DRAW_REASON.map((r) => ({
  dataKey: r.id,
  name: r.label,
  fill: REASON_COLORS[r.id] ?? '#6b7280',
}))

interface WithdrawalReasonTrendChartProps {
  data: MonthlyWithdrawalReasonStat[]
}

export default function WithdrawalReasonTrendChart({ data }: WithdrawalReasonTrendChartProps) {
  const [selectedReason, setSelectedReason] = useState<string>('all')

  const visibleBars =
    selectedReason === 'all'
      ? REASON_BARS
      : REASON_BARS.filter((bar) => bar.dataKey === selectedReason)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">
          탈퇴 사유별 월별 추세
        </h3>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">전체 사유</option>
          {REASON_BARS.map((bar) => (
            <option key={bar.dataKey} value={bar.dataKey}>
              {bar.name}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {visibleBars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.fill}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
