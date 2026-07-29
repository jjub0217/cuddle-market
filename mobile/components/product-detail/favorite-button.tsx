import { Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorite } from '@/hooks/use-favorite';

// 상세의 찜 버튼. 판매자 카드 아래 본문 인라인 자리(설계 §8.5).
//
// 하단 고정 바로 만들지 않는 이유: 지금은 버튼이 하나뿐이라 바가 될 이유가 없고,
// 채팅 버튼이 들어오는 바퀴에 어차피 다시 짜게 된다. 그때 승격시킨다.

interface Props {
  productId: number;
  /** 서버가 준 현재 찜 여부. 비로그인 조회에서는 null로 온다. */
  isFavorite: boolean | null;
}

export function FavoriteButton({ productId, isFavorite }: Props) {
  const active = isFavorite === true;
  const { toggle, isPending } = useFavorite(productId, active);

  return (
    <Pressable
      onPress={toggle}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? '찜 취소' : '찜하기'}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.pressed,
      ]}
    >
      <IconSymbol
        name={active ? 'heart.fill' : 'heart'}
        size={22}
        color={active ? '#FC8181' : '#6B7280'}
      />
      <Text style={[styles.label, active && styles.labelActive]}>
        {active ? '찜한 상품' : '찜하기'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  buttonActive: {
    borderColor: '#FC8181',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  labelActive: {
    color: '#FC8181',
  },
  pressed: {
    opacity: 0.7,
  },
});
