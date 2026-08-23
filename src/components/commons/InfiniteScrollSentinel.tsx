'use client'

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
// ⚠️ **키보드만 쓰는 사람은 다음 페이지로 못 간다.** 구르는 것은 마우스·터치 동작이라
//    깃발이 안 걸린다. 홈·알림·채팅방 목록이 이미 같은 상태라 여기만 다르게 두지 않았다.
//    고칠 때는 **네 곳을 같이** 고쳐야 한다.
interface InfiniteScrollSentinelProps {
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
