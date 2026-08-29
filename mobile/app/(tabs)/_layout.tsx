import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Home, MapPin, MessageCircleMore, UsersRound, UserRound } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';

// ⚠️ 아래 <Tabs.Screen> 차례는 **탭바에 보이는 순서**만 정한다.
//    앱을 켰을 때 어느 탭이 열리는지는 바로 아래 `anchor` 가 정한다.

/**
 * 앱을 열었을 때 **어느 탭이 먼저 나오는가** (#1096).
 *
 * ⚠️ **이것이 없으면 채팅 탭이 열린다.** 괄호로 감싼 폴더는 URL 에 안 들어가서
 *    다섯 탭이 다 `/` 에 해당하고, 그래서 알파벳순으로 걸린다 —
 *    (chat) · (community) · (home) · (my) · (place) 중 c-h-a 가 가장 앞이다.
 *
 * ⚠️ **2026-08-27 에 실제로 그랬다.** 첫 production 빌드(versionCode 3)를 실기기에
 *    깔았더니 로그인 전 「로그인이 필요합니다」만 있는 채팅 화면이 첫 화면이었다.
 *    앱을 완전히 껐다 켜도 마찬가지였다.
 *
 * ⚠️ **개발 빌드로는 이 문제가 안 보였다.** 그쪽은 보던 주소를 들고 다시 켜기 때문이다.
 *    그래서 production 빌드를 처음 만든 날에야 드러났다.
 *
 * ⚠️ `app/index.tsx` 의 `<Redirect href="/(tabs)/(home)" />` 도 같은 일을 하는데,
 *    **그것만으로는 부족했다.** 둘 다 둔다 — 하나가 안 먹을 때 다른 하나가 받는다.
 *
 * ⚠️ 이름이 `initialRouteName` 이 아니라 `anchor` 다. expo-router 6(SDK 54)에서
 *    바뀌었다. 뿌리 `app/_layout.tsx` 도 `anchor: '(tabs)'` 를 쓴다.
 */
export const unstable_settings = {
  anchor: '(home)',
};

/**
 * 탭바 아이콘 선 굵기. Lucide 기본값은 2인데 28px로 크게 그리니 둔해 보였다.
 * (웹 BottomNav은 활성 2.5 / 비활성 2 — 웹은 20px이라 같은 굵기여도 덜 두껍게 보인다.)
 */
const TAB_ICON_STROKE = 1.75;

/** 탭바 아이콘 크기. 28은 살짝 컸다. (웹 BottomNav은 20이지만 화면 폭이 달라 그대로는 못 쓴다.) */
const TAB_ICON_SIZE = 26;

/**
 * 탭바 본문 높이(안전영역 제외).
 *
 * 라이브러리 기본값은 49라 아이콘과 글자가 위아래로 빡빡했다. **당근 앱에 맞췄다** —
 * 스크린샷에서 재보니 탭바가 화면 세로의 약 7.2%(1390px 중 100px)였고,
 * 갤럭시 계열 화면 세로 약 780dp 기준으로 56dp쯤이다.
 * ⚠️ 사진으로 잰 값이라 오차가 있다. 실기기에서 당근과 나란히 놓고 확인할 것.
 *
 * ⚠️ **여기를 바꾸면 `components/ui/toast-host.tsx` 의 `TAB_BAR_CLEARANCE` 도 같이 바꾼다.**
 *    토스트는 탭 화면 **밖**(루트)에 그려서 탭바 높이를 실행 중에 물어볼 수 없고,
 *    이 값을 보고 못 박아 두기 때문이다. (탭 화면 **안**에 그리는 것들 — 홈의 떠 있는
 *    「상품 등록」 단추 같은 것 — 은 아래 끝이 이미 탭바 위라 안 건드려도 된다.)
 */
const TAB_BAR_HEIGHT = 56;

/** 아이콘 위쪽 숨통. 아이콘이 탭바 천장에 붙어 보이던 것을 띄운다. */
const TAB_BAR_PADDING_TOP = 6;

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        // 고른 탭의 색. 앱의 다른 「고른 것」과 같은 브랜드 갈색이다.
        tabBarActiveTintColor: colors.action,
        headerShown: false,
        tabBarButton: HapticTab,
        // 기본값은 10인데(bottom-tabs의 labelBeneath) 너무 작았다.
        // 12는 웹 BottomNav의 text-xs와 같은 값이다.
        tabBarLabelStyle: { fontSize: 12 },
        // ⚠️ 높이를 우리가 정하면 **안전영역도 우리가 더해야 한다.** 안 더하면 탭바가
        //    3버튼 바·제스처 바에 깔린다. (안 정할 때는 bottom-tabs가 알아서 더해 준다)
        //    Expo Go 에서는 insets.bottom 이 늘 0이라 이 실수가 안 보인다 —
        //    여백은 개발 빌드로 확인할 것(mobile/AGENTS.md).
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: TAB_BAR_PADDING_TOP,
        },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />,
        }}
      />
      {/* 웹 BottomNav과 같은 순서·아이콘이다 — 홈 → 커뮤니티 → 플레이스 → 채팅 → 마이.
          20바퀴에 채팅이 플레이스와 마이 사이로 들어와 웹과 똑같은 다섯이 됐다.
          커뮤니티는 게스트를 막지 않는다 — 서버가 비회원 조회를 허용한다. */}
      <Tabs.Screen
        name="(community)"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ color }) => (
            <UsersRound size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />
          ),
        }}
      />
      {/* 이름은 웹이 쓰는 「플레이스」다. 「지도」로 새로 짓지 않는다 —
          탭 이름과 화면 이름이 다르면 같은 곳인지 헷갈린다. 아이콘도 웹과 같은 MapPin. */}
      <Tabs.Screen
        name="(place)"
        options={{
          title: '플레이스',
          tabBarIcon: ({ color }) => (
            <MapPin size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />
          ),
        }}
      />
      {/* 웹 BottomNav 과 같은 자리·같은 아이콘이다 — 플레이스와 마이 사이. */}
      <Tabs.Screen
        name="(chat)"
        options={{
          title: '채팅',
          tabBarIcon: ({ color }) => (
            <MessageCircleMore size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />
          ),
        }}
        // 게스트는 탭 전환 자체를 막고 로그인 화면만 띄운다 — 마이 탭과 같은 방식이다.
        // 화면 안에서 밀어내면 로그인 취소 → 채팅 화면 → 또 밀어냄으로 갇힌다.
        listeners={{
          tabPress: (event) => {
            if (useAuthStore.getState().status === 'guest') {
              event.preventDefault();
              router.push('/login');
            }
          },
        }}
      />
      <Tabs.Screen
        name="(my)"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => (
            <UserRound size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />
          ),
        }}
        // 게스트가 마이 탭을 누르면 탭을 열지 않고 로그인 화면만 띄운다.
        //
        // 왜 마이 화면 안에서 밀어내지 않나:
        // 그러면 로그인을 취소했을 때 마이 화면으로 돌아오고, 마이 화면이 또 밀어내서
        // 빠져나갈 수 없는 무한 루프가 된다. 탭 전환 자체를 막으면 원래 보던 탭이
        // 그대로 남아 있어서, 취소하면 자연스럽게 거기로 돌아간다.
        //
        // 'restoring'(앱 켠 직후)일 때는 막지 않는다 — 로그인돼 있는데도 밀어내면 안 된다.
        // 그 짧은 사이에 열리면 마이 화면이 로딩 표시를 보여준다.
        listeners={{
          tabPress: (event) => {
            if (useAuthStore.getState().status === 'guest') {
              event.preventDefault();
              router.push('/login');
            }
          },
        }}
      />
    </Tabs>
  );
}
