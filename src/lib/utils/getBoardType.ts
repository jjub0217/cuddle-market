import { COMMUNITY_TABS } from '@/constants/constants'

type BoardTypeCode = (typeof COMMUNITY_TABS)[number]['code']

export const getBoardType = (boardType: BoardTypeCode): string => {
  const board = COMMUNITY_TABS.find((type) => type.code === boardType)
  return board?.label ?? boardType
}
