import { MY_PAGE_TABS, type MyPageTabId } from '@/constants/constants'

// 모바일 전체 화면 패널이 무엇인지를 주소(`?panel=`)에서 읽는다.
//
// 왜 주소에 담나 (#819):
// 예전에는 useState + history.pushState였다. 주소를 안 바꾸고 히스토리만 밀어 넣어서
// 「패널 안에서의 뒤로가기」는 됐지만, 상품 상세나 수정 화면으로 나갔다 돌아오면
// state가 사라져 판매내역이 아니라 마이 대시보드가 떴다.
//
// 주소에 담으면 뒤로가기·앞으로가기·새로고침·링크 공유가 다 저절로 맞는다.

/** 열려 있을 수 있는 패널. 'profile'은 프로필 자세히 보기다 */
export type MyPagePanel = MyPageTabId | 'activity' | 'profile'

/**
 * `?panel=` 값이 뜻하는 패널. 모르는 값이면 null(=닫힘)이다.
 *
 * 모르는 값을 그냥 통과시키면 빈 패널이 열려 나갈 길이 없어진다.
 * 주소는 사용자가 손으로 고칠 수 있으므로 여기서 걸러야 한다.
 */
export function resolvePanel(panelParam: string | null): MyPagePanel | null {
  if (!panelParam) return null
  if (panelParam === 'profile' || panelParam === 'activity') return panelParam
  if (MY_PAGE_TABS.some((tab) => tab.id === panelParam)) return panelParam as MyPageTabId
  return null
}
