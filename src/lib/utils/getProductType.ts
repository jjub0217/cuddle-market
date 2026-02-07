import { PRODUCT_TYPE_TABS } from '@/constants/constants'

export const getProductType = (productType: string) => {
  const type = PRODUCT_TYPE_TABS.find((type) => type.code === productType)
  return type?.label || productType
}
