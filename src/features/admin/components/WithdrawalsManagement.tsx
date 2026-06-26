'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { withdrawalTableConfig } from '../configs/withdrawalTableConfig'
import { fetchAdminWithdrawals } from '@/lib/api/admin'
import type { AdminWithdrawal } from '../types/adminApi'
import WithdrawalDetailModal from './members/WithdrawalDetailModal'

export default function WithdrawalsManagement() {
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null)

  return (
    <>
      <AdminTable<AdminWithdrawal>
        config={withdrawalTableConfig}
        queryKey="admin-withdrawals"
        fetchFn={fetchAdminWithdrawals}
        onRowClick={(w) => setSelected(w)}
      />
      <WithdrawalDetailModal
        isOpen={selected !== null}
        withdrawal={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
