'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { communityReportTableConfig } from '../../configs/communityReportTableConfig'
import { fetchAdminCommunityReports } from '@/lib/api/admin'
import type { MockCommunityReport } from '../../mocks/mockCommunityReports'
import CommunityReportDetailModal from './CommunityReportDetailModal'

export default function CommunityReportManagement() {
  const [selectedReport, setSelectedReport] = useState<MockCommunityReport | null>(null)

  return (
    <>
      <AdminTable<MockCommunityReport>
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
