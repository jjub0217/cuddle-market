import { getCategoryLabel, getPetDetailLabel } from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

// 사진 위 좌측의 `앵무새 › 사료/간식` 한 줄(웹 상세와 같은 위치).
// 이번 바퀴에서는 표시만 한다. 누를 곳(홈 필터)이 아직 없다.

interface Props {
  petDetailType: string;
  category: string;
}

export function Breadcrumb({ petDetailType, category }: Props) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={styles.item}>{getPetDetailLabel(petDetailType)}</Text>
      <Text style={styles.separator}>›</Text>
      {/* 마지막 항목은 굵게 + 브랜드 브라운(웹 text-primary=#633F00과 같은 값) */}
      <Text style={styles.last}>{getCategoryLabel(category)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  item: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  separator: {
    fontSize: 13,
    color: colors.onSurfaceSubtle,
  },
  last: {
    fontSize: 13,
    fontWeight: '700',
    // 텍스트 강조색은 브랜드 브라운. #EA580C(3.56:1, 작은글자 실패) 대신
    // #633F00(9.37:1)으로 대비를 확보한다.
    color: colors.brandText,
  },
});
