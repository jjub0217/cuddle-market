import { Redirect } from 'expo-router';

// 앱을 켜거나 다시 불러왔을 때 **홈** 탭으로 보낸다.
//
// ⚠️ 이 파일이 없으면 **채팅 탭**이 먼저 열린다.
//    expo-router 는 `/` 에 맞는 **첫 index.tsx** 를 찾는데, 괄호로 감싼 폴더는
//    URL 에 안 들어가서 다섯이 다 `/` 에 해당한다. 그래서 알파벳순으로 걸린다.
//
//      app/(tabs)/chat/index.tsx        ← c-h-a 가 가장 앞이라 이게 열린다
//      app/(tabs)/community/index.tsx   ← 채팅 탭이 생기기 전에는 이게 열렸다(c-o-m)
//      app/(tabs)/(home)/index.tsx
//      app/(tabs)/my/index.tsx
//      app/(tabs)/place/index.tsx
//
//    (tabs)/_layout.tsx 의 <Tabs.Screen> 차례는 **탭바에 보이는 순서**만 정한다.
//
// ⚠️ **아래 문단은 2026-08-27 에 틀린 것으로 드러났다. 되돌리지 말 것.**
//    예전에는 「unstable_settings 의 initialRouteName 은 딥링크로 들어왔을 때만
//    쓰이므로 첫 화면을 정하지 못한다」고 적어 두었다. 그런데 expo-router 6(SDK 54)
//    에서 이름이 **anchor** 로 바뀌었고, `(tabs)/_layout.tsx` 에 그것을 넣어야
//    첫 탭이 정해진다(#1096). 지금은 거기에 `anchor: '(home)'` 이 있다.
//
// ⚠️ **이 장치는 주소가 `/` 로 시작할 때만 작동한다.** 그래서 두 앱이 다르게 움직인다
//    (2026-08-13 실기기 확인).
//
//      Expo Go     리로드하면 처음 주소(/)로 돌아간다 → 여기를 거쳐 홈으로 간다
//      개발 빌드    보던 주소를 들고 다시 켠다 → 여기를 안 거친다 → 마지막 탭이 열린다
//
//    개발 빌드에서 「리로드했더니 채팅 탭이 열린다」는 **고장이 아니다.** 진짜 사용자는
//    리로드를 안 하고, 앱을 껐다 켤 때 마지막 탭으로 가는 것은 흔한 동작이라 그대로 뒀다.
//
// ⚠️ **그런데 production 빌드에서는 이 파일만으로 부족했다**(#1096). 앱을 완전히 껐다
//    켜도 채팅 탭이 열렸다. 그래서 `(tabs)/_layout.tsx` 의 anchor 와 **둘 다** 둔다.
//    이 파일을 지우지 말 것 — 하나가 안 먹을 때 다른 하나가 받는다.
export default function Index() {
  return <Redirect href="/(tabs)/(home)" />;
}
