import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
    // 손가락 제스처를 쓰려면 앱 맨 바깥을 이걸로 감싸야 한다. 안 감싸면 **안드로이드에서
    // 조용히 아무 반응이 없다** — 타입체크도 시험도 못 잡고 실기기에서만 드러난다.
    //
    // 14바퀴 전까지는 앱이 제스처를 한 번도 안 써서 없어도 됐다. 플레이스의 끌어올리는
    // 목록이 첫 사용처다.
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* 헤더는 화면들이 직접 그린다 — native-stack 헤더에는 상단 인셋 옵션이 없어
            실기기에서 상태바와 붙어 보인다.

            ⚠️ 화면마다 headerShown: false 를 적던 것을 여기 한 곳으로 모았다.
               새 화면을 더할 때 빠뜨리면 헤더가 두 겹이 된다 — 실제로 find-password 를
               더하면서 빠뜨려 뒤로가기와 제목이 둘씩 보였다(#838).
               (home) 스택이 같은 이유로 먼저 이렇게 바꿨다. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          {/* 로그인은 탭바까지 통째로 덮는다. 닫으면 원래 보던 자리로 돌아가므로
              웹처럼 redirectUrl을 들고 다닐 필요가 없다. */}
          <Stack.Screen name="login" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유). */}
          <Stack.Screen name="signup" />
          {/* 로그인 관문에서 「이메일로 로그인」을 누르면 오는 화면 */}
          <Stack.Screen name="email-login" />
          {/* 이메일 로그인의 비밀번호 칸 아래·관문 아래 링크에서 온다 */}
          <Stack.Screen name="find-password" />
          {/* 소셜 로그인을 마친 브라우저가 cuddlemarket://oauth 로 돌려보내는 자리.
              ⚠️ 이 화면이 없으면 「Unmatched Route」가 뜨고 로그인이 거기서 끊긴다 */}
          <Stack.Screen name="oauth" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              ⚠️ 이 화면은 건너뛸 수 없다 — 뒤로가기를 아예 안 그리고 하드웨어 뒤로가기도 막는다. */}
          <Stack.Screen name="social-signup" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유). */}
          <Stack.Screen name="notifications" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 집중해서 끝내는 화면이라 탭바가 보이면 안 된다. */}
          <Stack.Screen name="report" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 하단에 답글 칸이 늘 열려 있어
              탭바까지 있으면 아래가 두 겹이 된다. */}
          <Stack.Screen name="comment-thread" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유: 끝내고 나가는 화면이라 탭바가 보이면 안 된다. */}
          {/* 검색은 홈 위로 덮는다. 결과에서 뒤로 가면 검색 화면이 아니라 홈으로
              가야 해서, 검색 화면이 결과로 갈 때 replace 를 쓴다(app/search.tsx). */}
          <Stack.Screen name="search" />
          <Stack.Screen name="search-result" />
          <Stack.Screen name="products/new" />
          <Stack.Screen name="products/[id]/edit" />
          {/* 헤더는 화면이 직접 그린다(login과 같은 이유).
              탭 안이 아니라 루트에 두는 이유 둘: 하단에 입력칸이 늘 열려 있어 탭바까지
              있으면 아래가 두 겹이 되고(댓글 스레드와 같다), 들어오는 길이 셋이라
              (채팅 탭·상품 상세·알림) 탭 안에 두면 다른 탭에서 열 때 탭이 튄다. */}
          <Stack.Screen name="chat/[id]" />
        </Stack>
        {/* Stack 밖에 둔다 — 화면이 바뀌어도 살아남아야 한다.
            신고 화면은 성공하면 스스로 닫히는데, 화면 안에서 그리면 토스트도 같이 사라진다. */}
        <ToastHost />
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
