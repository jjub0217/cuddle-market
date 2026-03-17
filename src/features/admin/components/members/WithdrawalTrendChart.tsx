'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import type { MemberTrendStat } from '@/features/admin/types/adminApi'

type Period = 'monthly' | 'yearly'

interface WithdrawalTrendChartProps {
  data: MemberTrendStat[]
}

function aggregateByYear(data: MemberTrendStat[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const year = item.yearMonth.slice(0, 4)
    map.set(year, (map.get(year) ?? 0) + item.withdrawalCount)
  }
  return Array.from(map, ([year, withdrawalCount]) => ({ year, withdrawalCount }))
}

export default function WithdrawalTrendChart({ data }: WithdrawalTrendChartProps) {
  const [period, setPeriod] = useState<Period>('monthly')

  const chartData = useMemo(
    () => (period === 'yearly' ? aggregateByYear(data) : data.map((d) => ({ year: d.yearMonth, withdrawalCount: d.withdrawalCount }))),
    [data, period],
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{period === 'monthly' ? '월별' : '연별'} 회원 탈퇴 추세</h3>
        <div className="w-25">
          <SelectDropdown
            id="withdrawal-trend-period"
            value={period}
            onChange={(value) => setPeriod(value as Period)}
            options={[
              { value: 'monthly', label: '월별' },
              { value: 'yearly', label: '연별' },
            ]}
            buttonClassName="py-1.5"
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="withdrawalCount" name="탈퇴자 수" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
