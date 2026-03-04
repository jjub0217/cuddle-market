'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { productRequestReportTableConfig } from '../../configs/productRequestReportTableConfig'
import { fetchAdminProductRequestReports } from '@/lib/api/admin'
import type { MockProductRequestReport } from '../../mocks/mockProductRequestReports'
import ProductRequestReportDetailModal from './ProductRequestReportDetailModal'

export default function ProductRequestReportManagement() {
  const [selectedReport, setSelectedReport] = useState<MockProductRequestReport | null>(null)

  return (
    <>
      <AdminTable<MockProductRequestReport>
        config={productRequestReportTableConfig}
        queryKey="admin-product-request-reports"
        fetchFn={fetchAdminProductRequestReports}
        onRowClick={(report) => setSelectedReport(report)}
      />
      <ProductRequestReportDetailModal
        isOpen={selectedReport !== null}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  )
}
