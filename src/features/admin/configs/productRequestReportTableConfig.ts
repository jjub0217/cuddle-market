import { productSellReportTableConfig } from './productSellReportTableConfig'
import type { TableConfig } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

export const productRequestReportTableConfig: TableConfig<AdminReport> = {
  ...productSellReportTableConfig,
  title: '판매요청 상품 신고 관리',
}
