'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Tabs from '@/components/Tabs'
import SignupTrendChart from './SignupTrendChart'
import WithdrawalTrendChart from './WithdrawalTrendChart'
import WithdrawalReasonChart from './WithdrawalReasonChart'
import WithdrawalReasonTrendChart from './WithdrawalReasonTrendChart'
import { fetchMemberStats, fetchWithdrawalReasons } from '@/lib/api/admin'
import { mockMonthlyWithdrawalReasons } from '@/features/admin/mocks/mockMemberStats'

const DASHBOARD_TABS = [
  { id: 'signup', label: '회원 가입 추세', code: 'signup' },
  { id: 'withdrawal', label: '회원 탈퇴 추세', code: 'withdrawal' },
  { id: 'reason', label: '탈퇴 사유 분석', code: 'reason' },
] as const

export default function MembersDashboard() {
  const [activeTab, setActiveTab] = useState('signup')

  const { data: stats = [] } = useQuery({
    queryKey: ['admin', 'member-stats'],
    queryFn: fetchMemberStats,
  })

  const { data: reasons = [] } = useQuery({
    queryKey: ['admin', 'withdrawal-reasons'],
    queryFn: fetchWithdrawalReasons,
  })

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-800">회원 대시보드</h2>
      <div className="w-fit **:[[role-tablist]]:border-b-0">
        <Tabs tabs={DASHBOARD_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="회원 대시보드 탭" />
      </div>
      <div className="mt-6">
        {activeTab === 'signup' ? <SignupTrendChart data={stats} /> : null}
        {activeTab === 'withdrawal' ? <WithdrawalTrendChart data={stats} /> : null}
        {activeTab === 'reason' ? (
          <div className="flex flex-col gap-6">
            <WithdrawalReasonChart data={reasons} />
            <WithdrawalReasonTrendChart data={mockMonthlyWithdrawalReasons} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
