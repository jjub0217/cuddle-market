import { Stack } from 'expo-router';

// 채팅 탭 안의 스택. (community)·(home) 스택과 같은 모양이다.
//
// 채팅방은 여기 두지 않는다 — 루트(app/chat/[id].tsx)에 있다.
// 들어오는 길이 셋(탭·상품 상세·알림)이라, 탭 안에 두면 다른 탭에서 열 때 탭이 튄다.

export const unstable_settings = {
  initialRouteName: 'index',
};

// 화면마다 headerShown 을 적지 않는다 — 새 화면을 더할 때 빠뜨린다.
export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
