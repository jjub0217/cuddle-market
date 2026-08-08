// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // 색은 constants/colors.ts 에만 적는다.
    //
    // 화면에 직접 적으면 같은 색이 화면마다 조금씩 달라진다 — 19바퀴(#786)에
    // 그렇게 흩어진 567개를 걷어냈다. 그때 겪은 것들:
    //   같은 「다시 시도」가 목록에선 파랑, 상세에선 주황이었다
    //   같은 「등록」이 화면마다 다른 갈색이었다
    //   위험색이 #DC2626 과 #C91D1D 둘로 갈려 있었다
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'constants/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
    ],
    ignores: [
      'constants/colors.ts', // 토큰 원본
      'components/auth/social-login-buttons.tsx', // 카카오가 정한 색
      'components/auth/social-logos.tsx', // 구글 로고 SVG 네 색
      // NOTIFICATION_COLORS 로 이미 한곳에 모여 있고 이름도 뜻이 드러난다.
      // 옮겨 봐야 그 파일 밖에서는 안 쓰이는 토큰 12개만 는다.
      'lib/notifications.ts',
      'lib/notifications.test.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: '색 리터럴 금지 — @/constants/colors 의 토큰을 쓸 것',
        },
      ],
    },
  },
]);
