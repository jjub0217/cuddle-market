import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

// 화면 시험이 공통으로 쓰던 감싸개를 여기 하나로 모았다(#1059).
//
// 그동안은 시험 파일마다 감싸개를 손으로 새로 만들었는데, 그 안에서 매번
// `QueryClient` 설정도 다시 적다 보니 `gcTime: Infinity` 를 빠뜨리는 파일이 생겼다.
// 빠뜨리면 시험은 다 초록인데 jest 가 스스로 안 끝난다(mobile/AGENTS.md:44) —
// 2026-08-17 에 3분씩 두 번, 2026-08-24 에 다섯 파일이 또 걸렸다(#1053).
// 감싸개를 만드는 조각을 하나로 모아 그 함정 자체를 없앤다.

/**
 * 안전영역이 필요한 화면 시험이 공통으로 쓰는 값(아이폰 14 기준). 시험에는 재는 사람이
 * 없어 「No safe area value available」로 죽으므로 값을 못 박아 준다.
 */
export const TEST_SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type TestQueryOptions = {
  /**
   * 화면이 `retry` 를 직접 정하는 경우(예: 404 는 안 되풀이) `retry: false` 를 줘도 안
   * 먹는다 — 재시도 사이의 기다림(1초·2초)만큼 시험 시간이 늘어난다. 그 기다림을
   * 없애려면 여기로 0 을 준다.
   */
  retryDelay?: number;
};

/**
 * ⚠️ `gcTime: Infinity` 가 꼭 있어야 한다. 기본값(5분)이면 「5분 뒤에 버린다」 타이머가
 *    남아 jest 가 스스로 안 끝난다. 밖에서 옵션을 아무리 넘겨도 이 값만은 못 바꾸게
 *    막아 뒀다 — 그게 이 조각을 만든 이유다.
 */
function createTestQueryClient(options: TestQueryOptions = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { ...options, retry: false, gcTime: Infinity },
      // ⚠️ **바꾸기(mutation)에도 따로 줘야 한다**(#1099). 위 `queries` 는 조회에만 걸린다.
      //    하트처럼 누르면 서버로 보내는 것을 시험하면 바꾸기 캐시가 자기 몫의 5분 타이머를
      //    남겨, 조회 쪽을 아무리 막아 놔도 jest 가 스스로 안 끝난다.
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

/**
 * `QueryClientProvider` 만 있으면 되는 화면 시험용 감싸개(안전영역 없는 화면).
 *
 * ⚠️ `client` 를 감싸개 컴포넌트 **안에서** 만든다. 시험(또는 rerender)마다 새
 *    `QueryClient` 를 준다 — 밖에서 하나만 만들어 두면 앞 시험이 채운 캐시를 다음
 *    시험이 물려받는다.
 */
export function createQueryWrapper(options: TestQueryOptions = {}) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    const client = createTestQueryClient(options);
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * 화면 시험용 감싸개. `safeArea: true` 를 주면 `SafeAreaProvider` 로도 감싼다 —
 * 사진 확대창·바텀시트처럼 `useSafeAreaInsets` 를 쓰는 조각이 딸려 오는 화면에 필요하다.
 *
 * Provider 순서는 `QueryClientProvider` 가 바깥, `SafeAreaProvider` 가 안쪽이다(옮기기
 * 전 8개 화면 시험 중 다섯이 이 순서였다 — 다수 순서로 통일했다).
 */
export function createScreenWrapper({
  safeArea = false,
  queryOptions,
}: { safeArea?: boolean; queryOptions?: TestQueryOptions } = {}) {
  return function ScreenWrapper({ children }: { children: ReactNode }) {
    const client = createTestQueryClient(queryOptions);
    const withQuery = <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    if (!safeArea) return withQuery;

    return (
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{withQuery}</SafeAreaProvider>
    );
  };
}
