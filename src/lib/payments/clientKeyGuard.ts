// 토스 클라이언트 키 자리에 다른 키가 들어가면 빌드를 막는다 (#1128).
//
// NEXT_PUBLIC_ 값은 빌드 때 웹 코드에 그대로 박혀 누구나 볼 수 있다. 2026-11-01 운영에서 이 자리에
// 시크릿 키(test_sk_)가 들어가 공개됐고, 결제창도 열리지 않았다. 이 결제는 테스트 모드뿐이라
// 테스트 클라이언트 키(test_ck_)만 받는다. 비어 있으면 통과한다 — 결제하기가 「결제 준비 중」으로 막힐 뿐이다.
//
// next.config.ts 가 빌드 시작 때 부른다. 다른 모듈을 불러오지 않게 둔다(설정 파일에서 쓰므로).

const TEST_CLIENT_KEY_PREFIX = 'test_ck_'

export function assertTossClientKey(value: string | undefined): void {
  if (!value) return
  if (value.startsWith(TEST_CLIENT_KEY_PREFIX)) return
  // 키 값은 문구에 싣지 않는다 — 빌드 기록에 남는다
  throw new Error(
    'NEXT_PUBLIC_TOSS_CLIENT_KEY 에는 토스 「테스트 클라이언트 키」(test_ck_ 로 시작)만 넣을 수 있습니다. ' +
      '시크릿 키(test_sk_)·위젯 키·라이브 키가 들어가면 브라우저에 공개되거나 결제창이 열리지 않습니다.'
  )
}
