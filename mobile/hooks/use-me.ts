import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/lib/auth/store';
import { fetchMe } from '@/lib/profile';

/**
 * 내 프로필.
 * 'authed'일 때만 요청한다 — 게스트일 때 부르면 401만 받고 갱신 흐름이 헛돈다.
 * 'restoring'(앱 켠 직후)에도 아직 부르지 않는다.
 */
export function useMe() {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: status === 'authed',
  });
}
