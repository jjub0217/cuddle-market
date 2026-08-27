import { Stack } from 'expo-router';

// 플레이스 탭 안의 스택. 상세로 밀고 들어가도 하단 탭바가 남는다.
// ((home)·(my) 탭과 같은 방식이다 — Expo 공식 "Stacks inside tabs")
//
// 상세에서 탭바를 남기는 건 #845에서 정한 규칙이다. 읽기만 하는 화면이라 보다가
// 다른 탭으로 건너뛰기 쉬워야 한다. 하단에 고정 단추가 생기는 날 다시 판단한다.
export const unstable_settings = {
  // 상세로 바로 들어와도(딥링크) 지도가 스택 아래에 먼저 깔리게 한다.
  initialRouteName: 'index',
};

export default function PlaceStackLayout() {
  // 화면마다 끄지 않고 스택 전체에서 끈다 — 새 화면을 더할 때 빠뜨리면
  // 네이티브 헤더가 라우트 이름을 그대로 띄운다(#805에서 겪었다).
  return <Stack screenOptions={{ headerShown: false }} />;
}
