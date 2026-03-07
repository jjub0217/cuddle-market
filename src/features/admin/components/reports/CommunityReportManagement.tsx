'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { communityReportTableConfig } from '../../configs/communityReportTableConfig'
import { fetchAdminCommunityReports } from '@/lib/api/admin'
import type { AdminReport } from '../../types/adminApi'
import CommunityReportDetailModal from './CommunityReportDetailModal'

export default function CommunityReportManagement() {
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)

  return (
    <>
      <AdminTable<AdminReport>
        config={communityReportTableConfig}
        queryKey="admin-community-reports"
        fetchFn={fetchAdminCommunityReports}
        onRowClick={(report) => setSelectedReport(report)}
      />
      <CommunityReportDetailModal
        isOpen={selectedReport !== null}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  )
}
