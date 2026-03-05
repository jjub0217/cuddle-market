'use client'

import { useState } from 'react'
import AdminTable from '../table/AdminTable'
import { productSellReportTableConfig } from '../../configs/productSellReportTableConfig'
import { fetchAdminProductSellReports } from '@/lib/api/admin'
import type { MockProductSellReport } from '../../mocks/mockProductSellReports'
import ProductSellReportDetailModal from './ProductSellReportDetailModal'

export default function ProductSellReportManagement() {
  const [selectedReport, setSelectedReport] = useState<MockProductSellReport | null>(null)

  return (
    <>
      <AdminTable<MockProductSellReport>
        config={productSellReportTableConfig}
        queryKey="admin-product-sell-reports"
        fetchFn={fetchAdminProductSellReports}
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
