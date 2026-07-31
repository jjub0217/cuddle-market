// 앱 밖으로 나가는 안내 주소를 한 곳에 모은다.
//
// 헤더 햄버거와 마이 탭이 같은 곳을 가리켜야 하는데, 두 화면이 각자 문자열을
// 들고 있으면 한쪽만 고쳐져 서로 다른 데로 간다. 실제로 8바퀴 전까지
// (my)/index.tsx 안에만 있던 값이다.
//
// 앱에서 따로 그리지 않고 웹 페이지를 그대로 여는 이유:
// 법·정책 문서는 한 곳에서만 고쳐야 웹과 앱이 어긋나지 않는다. 앱에 복사해 두면
// 문구가 바뀔 때마다 스토어 심사를 다시 받아야 한다.

/** 1:1 문의. 메일 앱이 제목까지 채운 채로 열린다. */
export const SUPPORT_MAIL_URL = 'mailto:devel.jjub@gmail.com?subject=커들마켓 1:1 문의';

/**
 * 개인정보처리방침.
 *
 * ⚠️ 로그인 없이도 닿을 수 있어야 한다 — Play 정책이 「앱 안에서」 방침에 닿을 길을
 * 요구한다. 그래서 이 줄은 마이 탭이 아니라 헤더 햄버거에 있다(마이 탭은 로그인해야
 * 열린다). 옮기지 말 것.
 */
export const PRIVACY_URL = 'https://cuddle-market.vercel.app/privacy';

/**
 * 계정 삭제 안내.
 *
 * 앱 안 「탈퇴하기」와 별개로 필요하다 — Play는 앱을 지운 사람도 웹에서 계정 삭제
 * 절차를 볼 수 있어야 한다고 본다. 그래서 이것도 로그인 없이 닿아야 한다.
 */
export const ACCOUNT_DELETION_URL = 'https://cuddle-market.vercel.app/account-deletion';
