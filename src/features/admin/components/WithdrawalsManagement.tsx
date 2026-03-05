'use client'

import AdminTable from './table/AdminTable'
import { withdrawalTableConfig } from '../configs/withdrawalTableConfig'
import { fetchAdminWithdrawals } from '@/lib/api/admin'
import type { MockWithdrawal } from '../mocks/mockWithdrawals'

export default function WithdrawalsManagement() {
  return (
    <AdminTable<MockWithdrawal>
      config={withdrawalTableConfig}
      queryKey="admin-withdrawals"
      fetchFn={fetchAdminWithdrawals}
    />
  )
}
