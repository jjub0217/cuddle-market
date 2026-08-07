import { Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { normalizeKeyword } from '@/lib/search';

// 커뮤니티 목록 안에 놓는 검색칸.
//
// **웹과 같은 자리다** — 웹도 커뮤니티는 목록에 검색창을 얹는다(`CommunityPage.tsx:214`).
// 상품은 헤더 돋보기 → 별도 화면인데, 그건 「찾을 게 정해져 있어 들어오는」 흐름이라서다.
// 커뮤니티는 목록을 보다가 찾게 되므로 보던 자리에 칸이 있는 게 맞다(설계 §2).
//
// ⚠️ **`products/search-bar-header.tsx` 를 못 쓴다.** 그건 뒤로가기가 필수인 **헤더**이고,
//    무엇보다 **빈 검색어를 안 넘긴다**(`if (!normalized) return`). 여기는 검색어를 지우면
//    전체 목록으로 돌아와야 해서 그 규칙과 정반대다.

interface Props {
  /** 지금 걸린 검색어. 밖에서 바뀌면 칸도 따라간다 */
  keyword: string;
  /** 확인 키를 눌렀을 때. **빈 글자도 넘긴다** — 전체 목록으로 돌아가는 길이다 */
  onSubmit: (keyword: string) => void;
}

export function PostSearchInput({ keyword, onSubmit }: Props) {
  const inputRef = useRef<TextInput>(null);
  // 치는 동안의 글자. 확인 키를 눌러야 밖으로 나간다.
  const [text, setText] = useState(keyword);

  // ⚠️ **밖에서 바뀔 때만 맞춘다.** `value={keyword}` 로 바로 묶으면 **글자를 칠 수가 없다** —
  //    확인 키를 눌러야 밖의 값이 바뀌기 때문이다. 반대로 안 맞추면, 탭을 바꿔 검색어가
  //    풀렸는데 칸에 옛 글자가 남아 「지웠는데 그대로」로 보인다.
  //    `keyword` 가 그대로면 이 효과가 안 도므로 치던 글자는 안 건드린다.
  useEffect(() => {
    setText(keyword);
  }, [keyword]);

  /**
   * 글자를 칠 때마다 부른다.
   *
   * ⚠️ **비었을 때만 곧바로 알린다.** 지우기(X)를 누른 것과 같아진다 — 손으로 다 지웠는데
   *    확인 키를 또 눌러야 하면 「지웠는데 목록이 그대로」가 된다.
   *
   * ⚠️ 반대로 **글자가 있을 때는 안 알린다.** 한 글자마다 서버를 부르면 목록이 계속
   *    깜빡인다. 그때는 확인 키를 기다린다.
   */
  const change = (next: string) => {
    setText(next);
    if (normalizeKeyword(next) === null) onSubmit('');
  };

  const submit = () => {
    // normalizeKeyword 는 빈 값에 null 을 준다. 여기서는 **빈 글자로** 바꿔 넘긴다 —
    // 「검색을 그만둔다」도 알려야 하는 신호이기 때문이다.
    onSubmit(normalizeKeyword(text) ?? '');
  };

  const clear = () => {
    setText('');
    // ⚠️ 지우기는 **누르는 즉시** 반영한다. 확인 키를 또 누르게 하면
    //    「지웠는데 목록이 그대로」가 된다.
    onSubmit('');
    inputRef.current?.focus();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Search size={18} color="#9CA3AF" strokeWidth={2} />
        <TextInput
          ref={inputRef}
          testID="post-search-input"
          value={text}
          onChangeText={change}
          // 문구는 웹에서 가져왔다(CommunityPage.tsx:219). 새로 짓지 않는다
          placeholder="궁금한 내용을 검색해보세요"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={submit}
        />
        {text.length > 0 ? (
          <Pressable
            onPress={clear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="입력 내용 지우기"
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    // 웹도 둥근 칸이다(rounded-full)
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4C4B2',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    // 안드로이드는 TextInput 에 기본 여백이 있어 글자가 아래로 처진다
    paddingVertical: 0,
  },
});
