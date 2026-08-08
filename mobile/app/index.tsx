import { Redirect } from 'expo-router';

// 앱을 켜거나 다시 불러왔을 때 **홈** 탭으로 보낸다.
//
// ⚠️ 이 파일이 없으면 커뮤니티가 먼저 열린다.
//    expo-router 는 `/` 에 맞는 **첫 index.tsx** 를 찾는데, 괄호로 감싼 폴더는
//    URL 에 안 들어가서 넷이 다 `/` 에 해당한다. 그래서 알파벳순으로
//    (community)/index.tsx 가 걸린다.
//
//      app/(tabs)/(community)/index.tsx   ← c 가 가장 앞이라 이게 열렸다
//      app/(tabs)/(home)/index.tsx
//      app/(tabs)/(my)/index.tsx
//      app/(tabs)/(place)/index.tsx
//
//    (tabs)/_layout.tsx 의 <Tabs.Screen> 차례는 **탭바에 보이는 순서**만 정하고,
//    unstable_settings 의 initialRouteName 은 **딥링크로 들어왔을 때 스택 아래에
//    무엇을 깔지**를 정한다 — 둘 다 첫 화면을 정하지 못한다.
export default function Index() {
  return <Redirect href="/(tabs)/(home)" />;
}
