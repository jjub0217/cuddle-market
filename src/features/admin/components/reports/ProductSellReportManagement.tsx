'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { productSellReportTableConfig } from '../../configs/productSellReportTableConfig'
import { fetchAdminProductReports } from '@/lib/api/admin'
import type { AdminReport } from '../../types/adminApi'
import ProductSellReportDetailModal from './ProductSellReportDetailModal'

export default function ProductSellReportManagement() {
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)

  return (
    <>
      <AdminTable<AdminReport>
        config={productSellReportTableConfig}
        queryKey="admin-product-sell-reports"
        fetchFn={fetchAdminProductReports}
        onRowClick={(report) => setSelectedReport(report)}
      />
      <ProductSellReportDetailModal
        isOpen={selectedReport !== null}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  )
}
