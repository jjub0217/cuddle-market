import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBarHeader } from '@/components/products/search-bar-header';
import { colors } from '@/constants/colors';

// 커뮤니티 검색 화면. 커뮤니티 목록 헤더의 돋보기를 누르면 여기로 온다(#944 과제 4).
//
// 상품 검색 화면(app/search.tsx)과 **같은 검색 줄 조각**을 쓴다 — 두 화면이 다르게 생기면
// 오갈 때 글자가 들썩인다.
//
// ⚠️ **상품과 다른 점 하나.** 상품은 결과를 **별도 화면**(/search-result)에 그리는데,
//    커뮤니티는 **목록 화면으로 돌아가서** 검색어만 걸린다. 그 화면은 탭 안이라
//    게시판 탭과 하단 탭바가 계속 보인다 — 커뮤니티는 「보다가 찾는」 흐름이라
//    탭 밖으로 나가면 안 된다(설계 §③).

export default function CommunitySearchScreen() {
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 딥링크 등으로 뒤로 갈 곳이 없을 때의 대비. '/'는 여러 탭을 가리켜 어디로 갈지
      // 정해지지 않으므로 커뮤니티를 콕 집는다(app/search.tsx 와 같은 이유).
      router.replace('/(tabs)/community');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SearchBarHeader
        autoFocus
        onBack={close}
        // ⚠️ **`replace` 가 아니라 `dismissTo` 다.** 목록 화면은 이미 스택 아래에 있다 —
        //    `replace` 는 그걸 두고 **새 화면을 만들어** 두 화면이 각자 검색 줄을 그리며
        //    교차한다. 실기기에서 **검색 줄이 둘 겹쳐 보이며 덜커덕거렸다**(#944 과제 5).
        //    `dismissTo` 는 그 href 에 닿을 때까지 화면을 **걷어내서** 원래 목록을 드러낸다.
        //
        //    뒤로 갔을 때 이 빈 검색 화면이 아니라 원래 보던 자리로 가는 것도 그대로다.
        //    검색어를 고치고 싶으면 목록 헤더의 검색 줄에서 바로 고친다.
        onSubmit={(keyword) =>
          router.dismissTo({ pathname: '/(tabs)/community', params: { keyword } })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
});
