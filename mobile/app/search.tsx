import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { normalizeKeyword } from '@/lib/search';

// 검색 화면. 홈 헤더의 돋보기를 누르면 여기로 온다(#854).
//
// 헤더는 뒤로가기만 있다 — 「지금 어디에 있는가」를 알릴 이름이 따로 없다(입력칸 자체가
// 무엇을 하는 화면인지 말해 준다). 새 헤더를 만들지 않고 공용 조각을 그대로 쓴다(#841).
//
// ⚠️ 결과 화면(app/search-result.tsx)은 이 브랜치의 다른 조각(Task 6)이 만드는 중이라
// 아직 저장소에 없다. typedRoutes가 그 경로를 모르는 동안은 `as Href`로 눌러 둔다 —
// 그 화면이 생기면 지워도 되지만, 안 지워도 동작에는 지장이 없다.

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [keyword, setKeyword] = useState('');

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 딥링크 등으로 뒤로 갈 곳이 없을 때의 대비. '/'는 홈과 마이 둘 다를 가리켜
      // 어디로 갈지 정해지지 않으므로 홈을 콕 집는다(find-password.tsx와 같은 이유).
      router.replace('/(tabs)/(home)');
    }
  };

  const submit = () => {
    const normalized = normalizeKeyword(keyword);
    // 빈 검색어(공백만도 포함)는 넘기지 않는다 — 결과가 사실상 홈과 같아진다.
    if (!normalized) return;
    // replace — 결과 화면에서 뒤로 가면 이 검색 화면이 아니라 홈으로 가야 한다.
    router.replace({
      pathname: '/search-result',
      params: { keyword: normalized },
    } as unknown as Href);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onPressIcon={close} />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="원하는 반려동물 용품을 검색해보세요"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          // 화면에 들어오면 바로 자판이 뜨게 한다. 실기기에서 눈으로 확인이 필요하다
          // (RNTL은 실제 키보드를 안 띄우므로 시험으로는 못 지킨다).
          autoFocus
          returnKeyType="search"
          onSubmitEditing={submit}
        />
        {keyword.length > 0 ? (
          <Pressable
            onPress={() => {
              setKeyword('');
              inputRef.current?.focus();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="입력 내용 지우기"
            style={styles.clear}
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  // 입력칸 색·테두리·모서리는 signup/field.tsx의 input과 같은 값이다(마음대로 새로 안 지음).
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  clear: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
