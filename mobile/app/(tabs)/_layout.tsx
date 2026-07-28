import { Tabs, useRouter } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(my)"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
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
