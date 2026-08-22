import type { Rule, UserConfig } from '@commitlint/types'

/**
 * 커밋 헤더 끝에 `(#이슈번호)` 를 붙였는지 본다.
 *
 * ⚠️ **이슈 하나만 허용하면 이 저장소에서는 못 쓴다.** 한 PR 에 이슈 여럿을 담는 일이
 *    잦아서(작업 트리가 하나라 웹·앱을 한 브랜치에 담는다) `(#1009, #1010, #1011)` 같은
 *    헤더가 실제로 많다. 2026-08-22 에 재 보니 **최근 120커밋 중 9개**가 그 모양이었다.
 *
 * ⚠️ **`docs` 는 면제한다.** 이어받기 문서·기록처럼 이슈 없이 남기는 커밋이 있다.
 *    최근 200커밋에서 이슈번호가 없던 것은 **전부 `docs`** 였다(10개).
 *    ⚠️ 「이슈 먼저」 규칙 자체를 푼 것이 아니다 — 문서 이슈를 만들었다면 붙이는 편이 낫다.
 *
 * ⚠️ **이슈번호 뒤에 꼬리말이 붙는 것도 허용한다.** 여러 단계로 나눈 일에 실제로 쓴다 —
 *    `(#944 과제 5)` 처럼. 최근 120커밋 중 8개가 그 모양이었다.
 *
 * 통과하는 모양:  (#32) · (#1009, #1010) · (#994 · #995) · (#944 과제 5)
 */
const issueSuffixRule: Rule = (parsed) => {
  const type = parsed.type ?? ''
  if (type === 'docs') return [true, '']

  const h = parsed.header ? String(parsed.header) : ''
  // 하나 또는 여럿. 사이는 쉼표나 가운뎃점으로 잇는다
  const ok = /\(#\d+(?:\s*[,·]\s*#\d+)*[^)]*\)$/.test(h)
  return [
    ok,
    ok
      ? ''
      : '커밋 헤더 끝에 "(#이슈번호)"를 붙여주세요. 여럿이면 "(#32, #33)" 도 됩니다. (docs 는 면제)',
  ]
}

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'issue-suffix': issueSuffixRule,
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'design',
        'style',
        'test',
        'chore',
        'init',
        'rename',
        'remove',
        'docs',
        // 표준 종류인데 빠져 있었다. 실제로 쓴 커밋이 있다(#904 되돌리기)
        'revert',
      ],
    ],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],

    // 🔥 커밋 헤더 끝에 "(#숫자)" 강제
    'issue-suffix': [2, 'always'],
  },
}

export default Configuration
