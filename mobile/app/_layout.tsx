import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { restore } from '@/lib/auth/session';

export const unstable_settings = {
  anchor: '(tabs)',
};

// TanStack Query 클라이언트는 앱 생명주기 동안 1개만 유지(모듈 스코프).
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 기기에 남은 토큰으로 세션을 되살린다. 앱 실행당 한 번.
  // 결과를 기다리며 화면을 붙잡지 않는다 — 수십 ms지만 매 실행마다 느려 보인다.
  useEffect(() => {
    restore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* 로그인은 탭바까지 통째로 덮는다. 닫으면 원래 보던 자리로 돌아가므로
              웹처럼 redirectUrl을 들고 다닐 필요가 없다. */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유). */}
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
