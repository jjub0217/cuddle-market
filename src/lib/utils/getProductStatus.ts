import { CONDITION_ITEMS } from '@/constants/constants'

export const getProductStatus = (productStatus: string) => {
  const condition = CONDITION_ITEMS.find((status) => status.value === productStatus)
  return condition?.title || productStatus
}
