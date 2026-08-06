import { Tabs, useRouter } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Home, MapPin, UsersRound, UserRound } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth/store';

/**
 * 탭바 아이콘 선 굵기. Lucide 기본값은 2인데 28px로 크게 그리니 둔해 보였다.
 * (웹 BottomNav은 활성 2.5 / 비활성 2 — 웹은 20px이라 같은 굵기여도 덜 두껍게 보인다.)
 */
const TAB_ICON_STROKE = 1.75;

/** 탭바 아이콘 크기. 28은 살짝 컸다. (웹 BottomNav은 20이지만 화면 폭이 달라 그대로는 못 쓴다.) */
const TAB_ICON_SIZE = 26;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        // 기본값은 10인데(bottom-tabs의 labelBeneath) 너무 작았다.
        // 12는 웹 BottomNav의 text-xs와 같은 값이다.
        tabBarLabelStyle: { fontSize: 12 },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />,
        }}
      />
      {/* 웹 BottomNav과 같은 순서·아이콘이다 — 홈 → 커뮤니티 → 플레이스 → (채팅) → 마이.
          채팅이 15바퀴에 플레이스와 마이 사이로 들어오면 웹과 똑같은 다섯이 된다.
          게스트를 막지 않는다 — 서버가 비회원 조회를 허용한다. */}
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
