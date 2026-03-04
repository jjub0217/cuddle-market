'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyMemberStat } from '@/features/admin/mocks/mockMemberStats'

type Period = 'monthly' | 'yearly'

interface SignupTrendChartProps {
  data: MonthlyMemberStat[]
}

function aggregateByYear(data: MonthlyMemberStat[]) {
  const map = new Map<string, number>()
  for (const item of data) {
    const year = item.month.slice(0, 4)
    map.set(year, (map.get(year) ?? 0) + item.signups)
  }
  return Array.from(map, ([month, signups]) => ({ month, signups }))
}

export default function SignupTrendChart({ data }: SignupTrendChartProps) {
  const [period, setPeriod] = useState<Period>('monthly')

  const chartData = useMemo(
    () => (period === 'yearly' ? aggregateByYear(data) : data),
    [data, period],
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">
          {period === 'monthly' ? '월별' : '연별'} 회원 가입 추세
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="monthly">월별</option>
          <option value="yearly">연별</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="signups" name="가입자 수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
