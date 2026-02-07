import { COMMUNITY_TABS } from '@/constants/constants'

export const getBoardType = (boardType: string) => {
  const board = COMMUNITY_TABS.find((type) => type.code === boardType)
  return board?.label || boardType
}
