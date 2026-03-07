'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { productRequestReportTableConfig } from '../../configs/productRequestReportTableConfig'
import { fetchAdminProductReports } from '@/lib/api/admin'
import type { AdminReport } from '../../types/adminApi'
import ProductRequestReportDetailModal from './ProductRequestReportDetailModal'

export default function ProductRequestReportManagement() {
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)

  return (
    <>
      <AdminTable<AdminReport>
        config={productRequestReportTableConfig}
        queryKey="admin-product-request-reports"
        fetchFn={fetchAdminProductReports}
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
