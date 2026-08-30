import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * 화면에 **다시** 초점이 올 때 목록을 다시 부른다.
 *
 * 탭 목록은 상세로 갔다 돌아와도 **화면이 다시 만들어지지 않는다.** 그래서 react-query 가
 * 스스로 다시 부를 일이 없고, 상세에서 오른 조회수가 목록에는 영원히 옛 값으로 남는다(#932).
 * 목록을 다시 부르던 곳은 글 쓰기·수정·삭제(`invalidateQueries`)뿐이었다 — **읽고 돌아오는 길**이
 * 비어 있었다.
 *
 * ⚠️ **첫 초점은 건너뛴다.** 화면이 막 만들어질 때도 초점은 온다. 그때 부르면 질의가 이미
 *    보낸 요청과 겹쳐 **앱을 열 때마다 요청이 두 번** 나간다.
 *
 * ⚠️ 무한 목록(`useInfiniteQuery`)의 `refetch` 는 **받아 둔 페이지를 전부** 다시 받는다.
 *    깊이 스크롤한 채 오가면 그만큼 요청이 는다. 지금은 한두 페이지라 그대로 두지만,
 *    목록이 길어지면 상세에서 받은 값으로 그 항목만 고쳐 쓰는 쪽(`setQueryData`)을 봐야 한다.
 *
 * 채팅 목록은 로그인 여부까지 봐야 해서 자기 자리에 따로 쓴다
 * (`app/(tabs)/chat/index.tsx` — `refetch()` 는 `enabled` 를 무시해서 게스트면 401 을 받아 온다).
 */
export function useRefetchOnFocus(refetch: () => unknown) {
  const 첫초점 = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (첫초점.current) {
        첫초점.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
