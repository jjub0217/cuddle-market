import { ChevronLeft, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';
import { normalizeKeyword } from '@/lib/search';

// 뒤로가기와 검색 입력칸이 **한 줄에** 있는 헤더.
//
// ⚠️ 처음엔 공용 `ScreenHeader`(뒤로가기만) 아래에 입력칸을 따로 놓았다. 그러면 세로로
//    쌓여서 한 줄을 통째로 버린다. 실기기에서 어색해 보였다(2026-08-06).
//    **웹도 나란히다** — MobileSearchOverlay:64 `flex h-16 items-center gap-3`.
//    네이버 지도 앱도 `‹ [고기  🎤 ✕]` 로 한 줄이다.
//
// **검색 화면과 결과 화면이 이 조각을 나눠 쓴다.**
//
//   검색 화면   비어 있고 자판이 바로 뜬다
//   결과 화면   검색어가 들어 있고, 눌러서 바로 고칠 수 있다
//
// 두 화면의 검색 줄이 같은 모양이라 오갈 때 글자가 들썩이지 않는다.

/** 헤더 줄 높이. 앱의 다른 헤더(ScreenHeader)와 같은 값이다. */
const HEADER_HEIGHT = 52;

interface Props {
  /** 처음 들어 있을 검색어. 결과 화면이 넘긴다 */
  initialKeyword?: string;
  /** 들어오자마자 자판을 띄울지. 검색 화면만 true */
  autoFocus?: boolean;
  /** 확인 키를 눌렀을 때. **다듬어진**(앞뒤 공백 없는) 검색어가 온다 */
  onSubmit: (keyword: string) => void;
  onBack: () => void;
}

export function SearchBarHeader({ initialKeyword = '', autoFocus, onSubmit, onBack }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [keyword, setKeyword] = useState(initialKeyword);

  const submit = () => {
    const normalized = normalizeKeyword(keyword);
    // 빈 검색어(공백만도 포함)는 넘기지 않는다 — 결과가 사실상 홈과 같아진다.
    if (!normalized) return;
    onSubmit(normalized);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        style={({ pressed }) => (pressed ? styles.pressed : undefined)}
      >
        <ChevronLeft size={26} color={colors.onSurface} />
      </Pressable>

      <View style={styles.inputBox}>
        <TextInput
          ref={inputRef}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="원하는 반려동물 용품을 검색해보세요"
          placeholderTextColor={colors.onSurfaceSubtle}
          style={styles.input}
          // ⚠️ 실기기에서 눈으로 봐야 한다 — RNTL 은 진짜 자판을 안 띄운다.
          autoFocus={autoFocus}
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
          >
            <X size={16} color={colors.onSurfaceMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // 다른 헤더와 같은 16. 화면을 오갈 때 아이콘의 왼쪽 시작선이 흔들리면 안 된다.
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  // 색·테두리·모서리는 signup/field.tsx 의 입력칸과 같은 값이다(새로 짓지 않았다).
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    // 안드로이드는 기본 세로 여백이 있어 줄 높이가 들쭉날쭉해진다. 0으로 눌러 둔다.
    paddingVertical: 0,
  },
  pressed: { opacity: 0.5 },
});
