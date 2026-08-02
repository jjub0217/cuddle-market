import { Stack } from 'expo-router';

// 커뮤니티 탭 안의 스택. 상세로 밀고 들어가도 하단 탭바가 남는다.
// (Expo 공식 "Stacks inside tabs" 패턴 — (home)·(my) 스택과 같다)

export const unstable_settings = {
  // 상세로 바로 들어와도(알림을 눌러 들어오는 길) 목록이 스택 아래에 먼저 깔리게 한다.
  // 13바퀴 알림이 /(tabs)/(community)/posts/36으로 바로 밀어 넣는데, 이게 없으면
  // 뒤로 갈 데가 없다. (home) 스택도 같은 이유로 갖고 있다.
  initialRouteName: 'index',
};

// 화면마다 headerShown을 적지 않는다 — 새 화면을 더할 때 빠뜨린다.
// (home) 스택도 8바퀴에 같은 이유로 screenOptions로 바꿨다.
export default function CommunityLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
