import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBarHeader } from '@/components/products/search-bar-header';

// 검색 화면. 홈 헤더의 돋보기를 누르면 여기로 온다(#854).
//
// 화면이 거의 비어 있다 — 검색 줄이 전부다. 최근 검색어·추천어는 다음 바퀴(#855)다.
//
// ⚠️ 결과로 갈 때 push 가 아니라 **replace** 다. 결과에서 뒤로 가면 이 화면(빈 입력칸)이
//    아니라 **홈**으로 가야 한다. 검색어를 고치고 싶으면 결과 화면의 검색 줄에서 바로 고친다.

export default function SearchScreen() {
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 딥링크 등으로 뒤로 갈 곳이 없을 때의 대비. '/'는 홈과 마이 둘 다를 가리켜
      // 어디로 갈지 정해지지 않으므로 홈을 콕 집는다(find-password.tsx와 같은 이유).
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBarHeader
        autoFocus
        onBack={close}
        onSubmit={(keyword) =>
          router.replace({ pathname: '/search-result', params: { keyword } })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
});
