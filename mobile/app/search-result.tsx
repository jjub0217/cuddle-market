import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductListView } from '@/components/products/product-list-view';
import { ScreenHeader } from '@/components/ui/screen-header';

// 검색 결과.
//
// **이 파일이 짧은 것이 설계가 맞았다는 증거다.** 목록도 필터도 무한스크롤도
// ProductListView 가 이미 갖고 있다 — 검색어만 넘기면 된다(설계 §2).
//
// ⚠️ 검색 화면은 여기로 `replace` 로 온다. 그래서 뒤로 가면 검색 화면이 아니라 **홈**이다.
//    검색어를 고치고 싶으면 헤더의 검색어를 누른다.

export default function SearchResultScreen() {
  const router = useRouter();
  const { keyword } = useLocalSearchParams<{ keyword: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 제목이 곧 검색어다 — 지금 무엇을 찾고 있는지가 늘 보여야 한다.
          누르면 검색 화면으로 돌아가 고칠 수 있다. */}
      <ScreenHeader
        title={keyword}
        onPressIcon={() => router.back()}
        align="left"
      />
      <ProductListView keyword={keyword} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
