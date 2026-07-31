import { Stack } from 'expo-router';

// 홈 탭 안의 스택. 상세로 밀고 들어가도 하단 탭바가 남는다.
// (Expo 공식 "Stacks inside tabs" 패턴)
export const unstable_settings = {
  // 상세로 바로 들어와도(딥링크) 목록이 스택 아래에 먼저 깔리게 한다.
  initialRouteName: 'index',
};

export default function HomeStackLayout() {
  // 화면마다 끄지 않고 스택 전체에서 끈다.
  //
  // 전에는 index · products/[id]를 하나씩 적었는데, users/[id]를 더하면서 등록을
  // 빠뜨려 네이티브 헤더가 「users/[id]」라는 라우트 이름을 그대로 띄웠다(#805).
  // 이 탭의 화면은 전부 자기 헤더를 직접 그리므로 — 네이티브 스택 헤더에는 상단
  // 인셋 옵션이 없어 시계·배터리와 붙어 보인다 — 기본값으로 꺼 두는 게 맞다.
  // 마이 탭((my)/_layout.tsx)이 이미 이 방식이다.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
