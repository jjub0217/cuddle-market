import { STATUS_EN_TO_KO } from '@/constants/constants'

export const getTradeStatusColor = (tradeStatus: string) => {
  const condition = STATUS_EN_TO_KO.find((status) => status.value === tradeStatus)
  return condition?.bgColor || 'bg-onsale'
}
