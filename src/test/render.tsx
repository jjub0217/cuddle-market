import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// 시험에서 화면을 그릴 때 쓰는 감싸개.
//
// 앱 조각 상당수가 TanStack Query를 쓴다. 그냥 render()로 그리면
// "No QueryClient set"으로 죽는다. 그래서 여기서 감싸 준다.
//
// 시험마다 새 QueryClient를 만드는 이유: 캐시를 나눠 쓰면 앞 시험이 받아 둔 값이
// 다음 시험에 남아 「왜 통과하는지 모르겠는」 시험이 된다.

/** 시험용 QueryClient. 다시 시도하지 않고, 실패를 콘솔에 안 쏟는다 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 시험에서 재시도하면 실패가 몇 초씩 늦게 드러난다
        retry: false,
        staleTime: Infinity,
      },
      mutations: { retry: false },
    },
  })
}

function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={makeQueryClient()}>{children}</QueryClientProvider>
}

/** RTL의 render와 쓰는 법이 같다. 감싸개만 미리 붙어 있다 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}

// screen · fireEvent 등을 여기서 다시 내보내 시험 파일이 한 곳만 보게 한다
export * from '@testing-library/react'
export { renderWithProviders as render }
