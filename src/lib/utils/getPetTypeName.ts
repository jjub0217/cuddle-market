import { PET_DETAILS } from '@/constants/constants'

export const getPetTypeName = (petDetailCode: string) => {
  const detail = PET_DETAILS.find((detail) => detail.code === petDetailCode)
  return detail?.name || petDetailCode
}
