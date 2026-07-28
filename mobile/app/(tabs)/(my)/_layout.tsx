import { Stack } from 'expo-router';

// 마이 탭 안의 스택. 지금은 화면이 하나뿐이지만, 다음 바퀴의
// 찜한 상품 · 내 상품 목록이 여기 쌓인다(탭바를 유지한 채로).
// 헤더는 각 화면이 직접 그린다 — 홈 · 상세와 같은 방식.

export default function MyLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
