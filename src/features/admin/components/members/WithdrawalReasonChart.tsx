'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { WITHDRAW_REASON } from '@/constants/constants'
import type { WithdrawalReasonStat } from '@/features/admin/mocks/mockMemberStats'

const REASON_COLORS: Record<string, string> = {
  SERVICE_DISSATISFACTION: '#ef4444',
  PRIVACY_CONCERN: '#3b82f6',
  LOW_USAGE: '#f59e0b',
  COMPETITOR: '#8b5cf6',
  OTHER: '#6b7280',
}

const reasonLabelMap = Object.fromEntries(
  WITHDRAW_REASON.map((r) => [r.id, r.label]),
)

interface WithdrawalReasonChartProps {
  data: WithdrawalReasonStat[]
}

export default function WithdrawalReasonChart({ data }: WithdrawalReasonChartProps) {
  const displayData = data.map((d) => ({
    ...d,
    label: reasonLabelMap[d.reason] ?? d.reason,
  }))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-gray-800">
        탈퇴 사유별 분포
      </h3>
      <div className="flex items-center justify-center gap-6">
        <div className="w-[360px] shrink-0">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={displayData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                label={({ percent }) =>
                  `${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={true}
              >
                {displayData.map((entry) => (
                  <Cell
                    key={entry.reason}
                    fill={REASON_COLORS[entry.reason] ?? '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}명`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col gap-3">
          {displayData.map((entry) => (
            <li key={entry.reason} className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: REASON_COLORS[entry.reason] ?? '#6b7280' }}
              />
              <span className="w-28 text-sm text-gray-700">{entry.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {entry.count}명
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
