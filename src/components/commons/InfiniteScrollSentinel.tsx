'use client'

import LoadMoreFocusButton from '@/components/commons/LoadMoreFocusButton'
import Spinner from '@/components/commons/spinner/Spinner'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils/cn'

// 무한 목록의 끝에 두는 **감시 깃발**. 이것이 화면에 들어오면 다음 페이지를 부른다.
//
// 예전에는 화면마다 「더보기」 단추를 눌러야 했다(`LoadMoreButton`). 같은 화면인데
// **앱은 저절로 이어지고 웹만 단추**여서 갈려 있었다(#1046) —
// 앱 `mobile/app/(tabs)/(home)/users/[id].tsx` 의 `onEndReached` 가 그것이다.
//
// ⚠️ **`root` 를 안 준다.** `IntersectionObserver` 는 root 를 안 줘도 중간에서
//    `overflow` 로 자르는 조상들을 계산에 넣는다. 그래서 남의 프로필처럼 **목록 상자가
//    스스로 구르는 화면**(#1043)에서도 그대로 걸린다.
//    2026-08-23 에 두 겹으로 확인했다 —
//      ① 기법만 떼어내 진짜 크롬으로 쟀다(굴리기 전 0회 → 상자를 끝까지 굴린 뒤 1회)
//      ② 세 화면 모두 사람이 로그인해 눈으로 봤다. 저절로 이어진다
//
// ✅ **키보드만 쓰는 사람도 다음 페이지로 갈 수 있다**(#1061). 구르는 것은 마우스·터치
//    동작이라 깃발만으로는 안 걸린다 — 그래서 깃발 옆에 `LoadMoreFocusButton`(화면엔
//    안 보이지만 Tab 으로는 걸리는 단추)을 하나 더 둔다.
//    예전 주석은 「네 곳」이라 적었는데, 실제로 세어 보니 **아홉 곳**이었다 — 홈·커뮤니티·
//    채팅방 목록, 알림(전용 페이지·헤더 드롭다운·모바일 덮개로 **셋**), 그리고 이 컴포넌트를
//    쓰는 자리 셋(남의 프로필, 마이페이지 상품/차단 목록). 알림 셋은 컴포넌트가 각자 따로라
//    여기 고치는 것과 별개로 그쪽 세 파일도 따로 고쳐야 했다.
//
// ⚠️ 이 단추까지 Tab 이 수십~백 번 걸릴 수 있어(홈 실측 104번) `id` 를 반드시 받는다.
//    부르는 쪽이 이 id 를 그대로 `SkipToLoadMoreLink` 의 `targetId` 로 넘겨, 목록 **앞**에
//    건너뛰기 링크를 따로 둔다. 이 컴포넌트는 목록 **끝**에만 놓이므로 그 링크는
//    스스로 그리지 않는다 — 부르는 쪽(UserPage·MyPagePanel)이 목록 앞에 직접 둔다.
interface InfiniteScrollSentinelProps {
  /** 숨은 단추의 id. 부르는 쪽이 `SkipToLoadMoreLink` 에도 같은 값을 `targetId` 로 넘겨야 한다. */
  id: string
  /** 다음 페이지가 남았는가 (`useInfiniteQuery` 가 준다) */
  hasNextPage?: boolean
  /** 지금 다음 페이지를 받는 중인가 */
  isFetchingNextPage: boolean
  /** 깃발이 걸렸을 때 부를 것 — 보통 `fetchNextPage` */
  onLoadMore: () => void
  /**
   * 감시를 켤지. 목록이 아직 비었을 때 켜면 첫 그림에서 바로 걸려 두 번 부른다.
   * 보통 `products.length > 0` 을 넘긴다.
   */
  enabled: boolean
  className?: string
}

export default function InfiniteScrollSentinel({
  id,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  enabled,
  className,
}: InfiniteScrollSentinelProps) {
  const targetRef = useIntersectionObserver({
    enabled,
    hasNextPage,
    isFetchingNextPage,
    onIntersect: onLoadMore,
    // 홈이 쓰는 값과 같게 둔다(Home.tsx). 깃발이 절반쯤 보이면 부른다.
    threshold: 0.5,
  })

  // ⚠️ 깃발은 **다 받은 뒤에도 자리를 지킨다.** 없애 버리면 나중에 목록이 늘었을 때
  //    다시 붙일 마디가 없다. 높이만 있는 빈 상자라 눈에 안 띈다.
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div ref={targetRef} className="h-10 w-full" aria-hidden="true" />
      <LoadMoreFocusButton id={id} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={onLoadMore} />
      {/* 문구는 앱과 같은 말을 쓴다(`mobile/components/list-states.tsx` 의 `ListFooter`).
          ⚠️ **눈에 보이는 글자에 `aria-hidden` 을 준다.** `Spinner` 가 스스로 `role="status"` 와
             같은 말을 품고 있어서, 안 가리면 화면 낭독기가 「더 불러오는 중」을 **두 번 읽는다.**
             짝 시험이 이걸 잡아냈다(2026-08-23). 글자를 지우지 말고 가리는 까닭은 **눈으로 보는
             사람에게는 글자가 있어야** 하기 때문이다 — 도는 동그라미만으로는 무슨 일인지 모른다. */}
      {isFetchingNextPage ? (
        <div className="text-on-surface-variant flex items-center gap-2 pb-4 text-sm">
          <Spinner size="sm" label="더 불러오는 중" />
          <span aria-hidden="true">더 불러오는 중</span>
        </div>
      ) : null}
    </div>
  )
}
