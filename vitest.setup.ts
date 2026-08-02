import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 유닛 테스트가 켜질 때마다 도는 준비 코드.
//
// 스토리북 쪽(.storybook/)과는 아무 상관이 없다 — vitest.config.ts의 'unit' project만 이걸 쓴다.

// 화면을 그린 뒤 정리한다. 안 하면 다음 시험이 앞 시험의 화면까지 같이 보게 된다.
afterEach(() => {
  cleanup()
})

// jsdom에 없는 것들. 없으면 컴포넌트가 그려지다 죽는다.
//
// matchMedia는 Tailwind 반응형을 읽는 훅이나 framer-motion이 부른다.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

// framer-motion·가상 목록이 부른다. jsdom에는 없다.
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

window.IntersectionObserver = class {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
} as unknown as typeof IntersectionObserver
