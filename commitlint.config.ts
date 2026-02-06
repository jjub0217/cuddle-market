import type { Rule, UserConfig } from '@commitlint/types'

// 맨 뒤에 (#이슈번호) 체크를 위한 체크룰
const issueSuffixRule: Rule = (parsed) => {
  const h = parsed.header ? String(parsed.header) : ''
  const ok = /\(#\d+\)$/.test(h) // 끝에 "(#숫자)"가 있는지 체크
  return [
    ok,
    ok
      ? ''
      : '커밋 메시지 끝에 "(#이슈번호)"를 붙여주세요. 예) feat: 로그인 ui 작업(#32)',
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
