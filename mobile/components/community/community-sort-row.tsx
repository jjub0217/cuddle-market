import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

// 커뮤니티 목록의 정렬 줄.
//
// 셋뿐이라 시트로 감추지 않고 나란히 펼쳐 둔다 — 한 번에 고를 수 있고, 지금 무엇으로
// 정렬 중인지도 늘 보인다. 상품 목록은 넷이라 시트로 접었는데(product-list-toolbar),
// 여기는 그럴 만큼 많지 않다(설계 §2).
//
// 모양은 웹과 같다 — 나란히 놓고 사이에 옅은 세로 선(`CommunityPage.tsx:229`).
//
// ⚠️ **고른 것을 다시 눌러도 안 풀린다.** 정렬은 「지금 여기」를 가리키는 표시라,
//    눌렀는데 아무 데도 안 가면 어색하다. 켜고 끄는 알약과 다른 점이다.

/**
 * 웹 `COMMUNITY_SORT_TYPE`(`src/constants/constants.ts:171`)을 그대로 옮겼다 —
 * 웹에서 바뀌면 여기도 바꾼다. 문구를 새로 짓지 않는다.
 *
 * ⚠️ 서버에는 `oldest`(오래된 순)도 있고 진짜로 돈다
 *    (`PostRepositoryCustomImpl.java:112-127`). 그런데 **웹이 넷 중 셋만 쓴다** —
 *    우연이 아니라 고른 결과로 보여 우리도 안 쓴다(설계 §2).
 */
export const COMMUNITY_SORT_TYPES = [
  { id: 'latest', label: '최신순' },
  { id: 'views', label: '조회 순' },
  { id: 'comments', label: '댓글 순' },
] as const;

interface Props {
  /** 지금 고른 정렬. 모르는 값이면 아무것도 안 골라진 것으로 보인다 */
  sortBy: string;
  onChange: (next: string) => void;
}

export function CommunitySortRow({ sortBy, onChange }: Props) {
  return (
    <View style={styles.row}>
      {COMMUNITY_SORT_TYPES.map((sort, index) => {
        const active = sort.id === sortBy;
        return (
          <View key={sort.id} style={styles.item}>
            {/* 첫 칸 앞에는 선을 안 긋는다 */}
            {index > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              testID={`community-sort-${sort.id}`}
              onPress={() => onChange(sort.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
                {sort.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 오른쪽에 붙인다. 웹도 모바일 폭에서는 그렇다
    // (`CommunityPage.tsx` 의 `max-md:ml-auto` — 데스크탑만 왼쪽이다).
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 웹은 h-3 w-px 다. 같은 자리에 같은 굵기로 긋는다
  divider: {
    width: 1,
    height: 12,
    marginHorizontal: 12,
    backgroundColor: colors.outlineVariant,
  },
  button: {
    // 글자만 있는 단추라 누를 자리가 좁다. 위아래로 넓혀 손가락이 닿게 한다
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
  },
  // 고른 것은 앱의 다른 곳과 같은 브라운이다
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  labelIdle: {
    color: colors.onSurfaceMedium,
    fontWeight: '400',
  },
  pressed: {
    opacity: 0.7,
  },
});
