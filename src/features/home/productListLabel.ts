/**
 * 상품 목록 위 「개수 줄」 문구.
 *
 * 왜 따로 빼 두나: 이 문구를 **두 곳**이 그린다.
 *   1) StaticHomeFallback — 하이드레이션 **전**(서버가 보낸 첫 HTML)
 *   2) ProductsSection 의 ProductListHeader — 하이드레이션 **뒤**
 *
 * 둘이 다르면 Home 이 대역을 대신하는 순간 **글자가 튄다.** 같은 자리의 같은 말이라
 * 한 곳에서 만든다 — `isBottomNavHidden` 을 뺀 것과 같은 까닭이다.
 *
 * 검색 중에는 **무엇으로 검색했는지**를 같이 적는다(#1026). 좁은 폭에서는 검색칸이
 * MobileSearchOverlay 안에만 있어서, 엔터를 치면 검색어가 화면에서 사라진다 —
 * 결과만 보고는 왜 이 상품들이 나왔는지 알 수가 없었다.
 *
 * ⚠️ **폭으로 가르지 않는다.** 데스크탑은 헤더 검색칸에도 검색어가 남아 겹치지만,
 *    문구를 폭으로 가르려면 노드를 둘 그려 하나를 숨기거나(`aria-live` 칸이 둘이 된다)
 *    자바스크립트로 폭을 재야 한다. 후자는 이 저장소가 이미 데인 길이다(#614 —
 *    서버에는 window 가 없어 늘 「좁다」고 답한다).
 */
export function productListLabel(totalElements: number, keyword?: string | null): string {
  return keyword ? `'${keyword}' 검색 결과 ${totalElements}개` : `상품 ${totalElements}개`
}
