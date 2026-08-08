import { Pressable, StyleSheet, Text } from 'react-native';

import { Heart } from 'lucide-react-native';
import { colors } from '@/constants/colors';
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
      {/* 찜한 상태는 속을 채운다. Lucide는 아이콘이 하나뿐이고 fill로 채움을 켠다
          (Feather·MaterialIcons처럼 heart / heart.fill 두 이름이 따로 있지 않다). */}
      <Heart
        size={22}
        color={active ? colors.favorite : colors.onSurfaceMuted}
        fill={active ? colors.favorite : 'none'}
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
    borderColor: colors.outlineStrong,
    backgroundColor: colors.surface,
  },
  buttonActive: {
    borderColor: colors.favorite,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
  },
  labelActive: {
    color: colors.favorite,
  },
  pressed: {
    opacity: 0.7,
  },
});
