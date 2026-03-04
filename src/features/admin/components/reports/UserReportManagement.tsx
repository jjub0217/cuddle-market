'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { userReportTableConfig } from '../../configs/userReportTableConfig'
import { fetchAdminUserReports } from '@/lib/api/admin'
import type { MockUserReport } from '../../mocks/mockUserReports'
import UserReportDetailModal from './UserReportDetailModal'

export default function UserReportManagement() {
  const [selectedReport, setSelectedReport] = useState<MockUserReport | null>(null)

  return (
    <>
      <AdminTable<MockUserReport>
        config={userReportTableConfig}
        queryKey="admin-user-reports"
        fetchFn={fetchAdminUserReports}
        onRowClick={(report) => setSelectedReport(report)}
      />
      <UserReportDetailModal
        isOpen={selectedReport !== null}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  )
}
