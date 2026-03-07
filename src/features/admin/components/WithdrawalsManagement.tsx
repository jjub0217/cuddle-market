'use client'

import AdminTable from './table/AdminTable'
import { withdrawalTableConfig } from '../configs/withdrawalTableConfig'
import { fetchAdminWithdrawals } from '@/lib/api/admin'
import type { AdminWithdrawal } from '../types/adminApi'

export default function WithdrawalsManagement() {
  return (
    <AdminTable<AdminWithdrawal>
      config={withdrawalTableConfig}
      queryKey="admin-withdrawals"
      fetchFn={fetchAdminWithdrawals}
    />
  )
}
