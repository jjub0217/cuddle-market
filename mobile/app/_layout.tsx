import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ToastHost } from '@/components/ui/toast-host';
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
          {/* 로그인 관문에서 「이메일로 로그인」을 누르면 오는 화면 */}
          <Stack.Screen name="email-login" options={{ headerShown: false }} />
          {/* 소셜 로그인을 마친 브라우저가 cuddlemarket://oauth 로 돌려보내는 자리.
              ⚠️ 이 화면이 없으면 「Unmatched Route」가 뜨고 로그인이 거기서 끊긴다 */}
          <Stack.Screen name="oauth" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              ⚠️ 이 화면은 건너뛸 수 없다 — 뒤로가기를 아예 안 그리고 하드웨어 뒤로가기도 막는다. */}
          <Stack.Screen name="social-signup" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유). */}
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 집중해서 끝내는 화면이라 탭바가 보이면 안 된다. */}
          <Stack.Screen name="report" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 하단에 답글 칸이 늘 열려 있어
              탭바까지 있으면 아래가 두 겹이 된다. */}
          <Stack.Screen name="comment-thread" options={{ headerShown: false }} />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 끝내고 나가는 화면이라 탭바가 보이면 안 된다. */}
          <Stack.Screen name="products/new" options={{ headerShown: false }} />
          <Stack.Screen name="products/[id]/edit" options={{ headerShown: false }} />
        </Stack>
        {/* Stack 밖에 둔다 — 화면이 바뀌어도 살아남아야 한다.
            신고 화면은 성공하면 스스로 닫히는데, 화면 안에서 그리면 토스트도 같이 사라진다. */}
        <ToastHost />
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
