import { describe, expect, it } from 'vitest'
import { assertTossClientKey } from './clientKeyGuard'

// NEXT_PUBLIC_ 값은 빌드 때 웹 코드에 박혀 브라우저에 공개된다. 시크릿 키가 들어가면 빌드를 막는다(#1128).
describe('assertTossClientKey', () => {
  it('테스트 클라이언트 키는 통과한다', () => {
    expect(() => assertTossClientKey('test_ck_abc')).not.toThrow()
  })

  it('비어 있으면 통과한다 — 결제하기가 「결제 준비 중」으로 막힐 뿐이다', () => {
    expect(() => assertTossClientKey(undefined)).not.toThrow()
    expect(() => assertTossClientKey('')).not.toThrow()
  })

  it.each(['test_sk_abc', 'test_gsk_abc', 'test_gck_abc', 'live_ck_abc', 'live_sk_abc', 'abc'])(
    '%s 는 빌드를 막는다',
    (value) => {
      expect(() => assertTossClientKey(value)).toThrow(/NEXT_PUBLIC_TOSS_CLIENT_KEY/)
    }
  )

  it('오류 문구에 키 값을 싣지 않는다 — 빌드 기록에 시크릿이 남으면 안 된다', () => {
    try {
      assertTossClientKey('test_sk_secretvalue')
    } catch (e) {
      expect((e as Error).message).not.toContain('secretvalue')
    }
  })
})
