import Svg, { Path } from 'react-native-svg';

// 카카오·구글 로그인 단추에 붙는 공식 로고.
//
// 왜 그림 파일이 아니라 코드인가: 웹은 public/images/{kakao,google}.svg를 <Image>로 부르는데,
// 앱에서 .svg 파일을 import하려면 metro 변환기를 하나 더 얹어야 한다. 도형이 몇 개뿐이라
// react-native-svg(이미 깔려 있다. lucide가 쓴다)로 직접 그리는 편이 가볍다.
//
// ⚠️ 길(path)과 색은 웹 파일에서 **그대로** 옮겼다. 두 회사 모두 로그인 단추의 로고 모양과
//    색을 가이드로 정해 두었으니 임의로 바꾸지 마라.

/** 카카오 말풍선. 원본은 public/images/kakao.svg (viewBox 36×34, 검정) */
export function KakaoLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size * (36 / 34)} height={size} viewBox="0 0 36 34">
      <Path
        fillRule="evenodd"
        fill="#000000"
        d="m18 0c-9.9 0-18 6.2-18 13.9 0 4.8 3.1 9.1 7.9 11.6l-2 7.3c-0.2 0.7 0.5 1.2 1.1 0.8l8.7-5.8q1.2 0.1 2.3 0.1c9.9 0 18-6.2 18-14 0-7.7-8.1-13.9-18-13.9"
      />
    </Svg>
  );
}

/** 구글 G. 원본은 public/images/google.svg (viewBox 24×24, 네 조각 각각 다른 색) */
export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}
