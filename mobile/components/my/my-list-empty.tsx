import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

// 마이 목록(찜한 상품 · 판매 내역 · 구매 내역)의 빈 상태.
// 웹 src/components/EmptyState.tsx 와 같은 결 — 점선 테두리 박스 + 원형 배경 아이콘.
//
// 홈의 빈 상태(list-states.tsx의 EmptyState, 🐾 + 글자)와 왜 다른가:
// 웹도 두 가지를 쓴다. 홈은 "검색 결과가 없습니다" 한 줄이고(ProductsSection),
// 마이 목록·커뮤니티는 이 박스형이다. 상황이 다르니 모양도 다르다 —
// 홈의 빈 목록은 "찾는 게 없다"이고, 여기는 "아직 시작하지 않았다"에 가깝다.

interface Props {
  /** 'shippingbox'(판매·구매) 또는 'heart'(찜) */
  icon: 'shippingbox' | 'heart';
  title: string;
  description: string;
}

export function MyListEmpty({ icon, title, description }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.iconCircle}>
        <IconSymbol name={icon} size={32} color="#E2A958" />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 8,
    // 웹은 2px이지만 앱에서는 1로 둔다. 화면이 좁아 2는 도드라져 보인다.
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // 웹 primary-50. 앱에서는 판매자 카드 아바타가 이미 쓰는 값이다.
    backgroundColor: '#FAF3E6',
  },
  text: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
});
