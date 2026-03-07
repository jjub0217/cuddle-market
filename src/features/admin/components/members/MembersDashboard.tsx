'use client'

import { useState, useEffect } from 'react'
import Tabs from '@/components/Tabs'
import SignupTrendChart from './SignupTrendChart'
import WithdrawalTrendChart from './WithdrawalTrendChart'
import WithdrawalReasonChart from './WithdrawalReasonChart'
import WithdrawalReasonTrendChart from './WithdrawalReasonTrendChart'
import { fetchMemberStats, fetchWithdrawalReasons } from '@/lib/api/admin'
import type { MemberTrendStat, WithdrawalReasonStat } from '@/features/admin/types/adminApi'
import type { MonthlyWithdrawalReasonStat } from '@/features/admin/mocks/mockMemberStats'

const DASHBOARD_TABS = [
  { id: 'signup', label: '회원 가입 추세', code: 'signup' },
  { id: 'withdrawal', label: '회원 탈퇴 추세', code: 'withdrawal' },
  { id: 'reason', label: '탈퇴 사유 분석', code: 'reason' },
] as const

export default function MembersDashboard() {
  const [activeTab, setActiveTab] = useState('signup')
  const [stats, setStats] = useState<MemberTrendStat[]>([])
  const [reasons, setReasons] = useState<WithdrawalReasonStat[]>([])
  const [monthlyReasons, setMonthlyReasons] = useState<MonthlyWithdrawalReasonStat[]>([])

  useEffect(() => {
    Promise.all([
      fetchMemberStats(),
      fetchWithdrawalReasons(),
    ]).then(([statsData, reasonsData]) => {
      setStats(statsData)
      setReasons(reasonsData)
    })
    // Monthly withdrawal reasons - still mock only (no API endpoint)
    import('@/features/admin/mocks/mockMemberStats').then(({ mockMonthlyWithdrawalReasons }) => {
      setMonthlyReasons(mockMonthlyWithdrawalReasons)
    })
  }, [])

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-800">회원 대시보드</h2>
      <div className="w-fit [&_[role=tablist]]:border-b-0">
        <Tabs
          tabs={DASHBOARD_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="회원 대시보드 탭"
        />
      </div>
      <div className="mt-6">
        {activeTab === 'signup' && <SignupTrendChart data={stats} />}
        {activeTab === 'withdrawal' && <WithdrawalTrendChart data={stats} />}
        {activeTab === 'reason' && (
          <div className="flex flex-col gap-6">
            <WithdrawalReasonChart data={reasons} />
            <WithdrawalReasonTrendChart data={monthlyReasons} />
          </div>
        )}
      </div>
    </div>
  )
}
