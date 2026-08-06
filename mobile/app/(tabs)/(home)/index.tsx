import { useNavigation, useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ProductListView,
  type ProductListViewRef,
} from '@/components/products/product-list-view';
import { AppHeader, HeaderLogo } from '@/components/ui/app-header';
import { useAuthStore } from '@/lib/auth/store';

// 홈: 로그인 없이 상품 목록을 본다.
//
// **목록은 이 파일에 없다.** components/products/product-list-view.tsx 가 갖고 있고,
// 검색 결과 화면이 같은 조각을 쓴다 — 둘은 조건 하나(검색어)가 다를 뿐 같은 것이다(설계 §2).
//
// 이 화면에 남는 것은 껍데기뿐이다: 안전영역 · 헤더 · 떠 있는 「상품 등록」 단추.

export default function HomeScreen() {
  const router = useRouter();

  // 그리는 것이라 getState()가 아니라 구독한다 — 로그인하고 돌아왔을 때 단추가 저절로
  // 나타나야 한다. comment-thread.tsx도 같은 방식으로 본다.
  const isLoggedIn = useAuthStore((state) => state.status) === 'authed';

  const listRef = useRef<ProductListViewRef>(null);
  const navigation = useNavigation();

  // 홈 탭을 **다시** 누르면 처음 상태로 되돌린다(필터 풀고 맨 위로).
  //
  // ⚠️ 다른 탭에서 홈으로 올 때는 안 되돌린다. 탭은 「서랍」이라 열어 두면 그대로 있는
  //    편이 자연스럽다. **이미 홈에 있는데 또 누르는 것**만 「처음으로」 신호다.
  //    (웹은 주소가 하나뿐이라 이 둘을 구분 못 한다 — 앱이니까 구분한다.)
  useEffect(() => {
    const tabs = navigation.getParent();
    if (!tabs) return;
    // @ts-expect-error tabPress 는 탭 네비게이터에만 있어 타입에 안 잡힌다
    return tabs.addListener('tabPress', () => {
      if (navigation.isFocused()) listRef.current?.reset();
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 손으로 만들었던 「커들마켓」 헤더를 공용 조각으로 바꿨다(#806).
          같은 자리에 로고와 알림 벨이 함께 들어간다.

          돋보기는 오른쪽 줄 맨 앞에 온다. 모바일 웹도 좁은 화면에서는 돋보기만 두고
          누르면 덮개를 띄운다(Header.tsx:214). 검색창을 늘 띄우지 않는 이유는
          알약 두 줄만으로도 세로가 빠듯하기 때문이다(설계 §3). */}
      <AppHeader
        left={<HeaderLogo onPress={() => listRef.current?.reset()} />}
        right={
          <Pressable
            onPress={() => router.push('/search')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="검색"
            style={({ pressed }) => (pressed ? styles.iconPressed : undefined)}
          >
            <Search size={24} color="#111827" />
          </Pressable>
        }
      />

      {/* 떠 있는 단추가 마지막 카드를 가리지 않게 그만큼 비워 둔다.
          ⚠️ 단추가 있을 때만이다 — 게스트에겐 단추가 없어서, 늘 비워 두면
             목록 끝이 허전하게 뚫린다(2026-08-04 실기기에서 두 화면을 비교해 잡았다). */}
      <ProductListView
        ref={listRef}
        bottomInset={isLoggedIn ? FAB_CLEARANCE + FAB_HEIGHT + 12 : 12}
      />

      {/* 웹 Home.tsx와 같은 자리(오른쪽 아래)·같은 색(#825500). 로그인했을 때만 보인다 —
          누르고 나서 로그인하라는 말을 듣는 것보다 아예 안 보이는 편이 낫다. */}
      {isLoggedIn ? (
        <Pressable
          onPress={() => router.push('/products/new?from=home')}
          accessibilityRole="button"
          accessibilityLabel="상품 등록"
          style={({ pressed }) => [
            styles.fab,
            // 탭바 바로 위에 띄운다.
            { bottom: FAB_CLEARANCE },
            pressed && styles.fabPressed,
          ]}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabLabel}>상품 등록</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * 떠 있는 단추가 화면 아래에서 떨어지는 높이.
 *
 * ⚠️ 이 화면의 SafeAreaView는 edges={['top']}이라 **아래 끝이 이미 탭바 위**다.
 *    그래서 탭바 높이(56)를 여기서 또 뺄 이유가 없다 — 예전 값 72는 탭바를 두 번
 *    비키고 있었다.
 *
 * ⚠️ insets.bottom도 더하면 안 된다. 탭바가 이미 제스처 바를 비켜 놓았으므로
 *    같은 여백을 두 번 세게 된다.
 *    **Expo Go에서는 이 실수가 안 보인다** — app.json의 edgeToEdgeEnabled가 Expo Go에는
 *    안 먹어서 insets.bottom이 0이라 더해도 티가 안 난다. 개발 빌드·출시 빌드에서는
 *    24~48이 들어와 단추가 그만큼 떠오른다(2026-08-04 실기기에서 드러났다).
 *
 * 토스트(toast-host.tsx)가 쓰는 72와 다른 이유도 그것이다. 토스트는 탭 화면 밖
 * 루트에 그려서 탭바 높이를 자기가 비켜야 한다.
 */
const FAB_CLEARANCE = 16;

/**
 * 떠 있는 단추의 높이. 목록 끝에 그만큼을 비워 마지막 카드가 안 가리게 한다.
 *
 * 재서 못 박은 값이다 — 위아래 여백 12+12에 글자·아이콘 줄 높이 20쯤.
 * 단추 안의 글자 크기를 바꾸면 이 값도 같이 봐야 한다.
 */
const FAB_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  iconPressed: {
    opacity: 0.5,
  },
  // bottom은 안전영역 + FAB_CLEARANCE로 그리는 자리에서 정한다.
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#825500',
    // 목록 위에 떠 있는 것이라 그림자가 없으면 카드에 붙어 보인다
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
