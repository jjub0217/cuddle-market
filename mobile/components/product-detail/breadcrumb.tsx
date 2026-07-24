import { getCategoryLabel, getPetDetailLabel } from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

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
      {/* 마지막 항목은 웹과 같이 굵게 + 포인트색 */}
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
    color: '#6B7280',
  },
  separator: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  last: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});
