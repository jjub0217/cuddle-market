import { Stack } from 'expo-router';

// 홈 탭 안의 스택. 상세로 밀고 들어가도 하단 탭바가 남는다.
// (Expo 공식 "Stacks inside tabs" 패턴)
export const unstable_settings = {
  // 상세로 바로 들어와도(딥링크) 목록이 스택 아래에 먼저 깔리게 한다.
  initialRouteName: 'index',
};

export default function HomeStackLayout() {
  return (
    <Stack>
      {/* 홈은 자체 헤더(커들마켓)를 갖고 있어 스택 헤더를 숨긴다 */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* 상세도 자체 헤더(DetailHeader)를 쓴다.
          네이티브 스택 헤더는 상단 인셋(상태바 높이)을 지정할 옵션이 없어
          시계·배터리와 뒤로가기가 붙어 보였다. 홈과 같은 방식으로 통일한다. */}
      <Stack.Screen name="products/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
