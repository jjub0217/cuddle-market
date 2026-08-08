import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductListView } from '@/components/products/product-list-view';
import { SearchBarHeader } from '@/components/products/search-bar-header';
import { colors } from '@/constants/colors';

// 검색 결과.
//
// **이 파일이 짧은 것이 설계가 맞았다는 증거다.** 목록도 필터도 무한스크롤도
// ProductListView 가 이미 갖고 있다 — 검색어만 넘기면 된다(설계 §2).
//
// 헤더는 검색 화면과 **같은 검색 줄**이다. 검색어가 들어 있어 지금 무엇을 찾고 있는지
// 늘 보이고, 눌러서 바로 고칠 수 있다. 네이버 지도 앱도 결과 화면에서 검색창을 그대로 둔다.

export default function SearchResultScreen() {
  const router = useRouter();
  const { keyword } = useLocalSearchParams<{ keyword: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SearchBarHeader
        initialKeyword={keyword}
        onBack={() => router.back()}
        // 화면을 새로 밀지 않고 **이 화면의 검색어만 바꾼다.** push 하면 검색을 고칠 때마다
        // 화면이 쌓여서, 뒤로가기를 여러 번 눌러야 홈에 닿는다.
        onSubmit={(next) => router.setParams({ keyword: next })}
      />
      {/* ⚠️ 이 화면은 **탭 안이 아니라 루트**다. 아래에 탭바가 없어서 기기 바(제스처 바·
          3버튼 바)를 자기가 비켜야 한다 — SafeAreaView 의 edges 에 'bottom' 을 넣은
          이유다. 안 넣으면 마지막 카드가 기기 바에 가린다(2026-08-06 실기기).
          알림·답글 화면도 같은 이유로 그렇게 한다. */}
      <ProductListView keyword={keyword} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
});
