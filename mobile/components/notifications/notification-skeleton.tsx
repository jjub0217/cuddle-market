import { StyleSheet, View } from 'react-native';

// 알림 목록의 첫 로딩 뼈대.
//
// 왜 따로 만드나: 처음에는 홈의 list-states.tsx를 그대로 썼는데, 그건 상품 카드
// 모양(썸네일 + 배지 둘 + 가격)이라 알림 목록과 전혀 다르게 생겼다. 로딩 뼈대는
// 「곧 여기에 무엇이 올지」를 미리 보여주는 장치라, 모양이 다르면 오히려 헷갈린다.
//
// 알림 한 줄은 원형 아이콘 + 제목 + 본문 + 시간이다. 그 배치를 그대로 흉내 낸다.

const ROW_COUNT = 8;

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.icon} />
      <View style={styles.body}>
        <View style={[styles.bar, { width: '65%' }]} />
        <View style={[styles.bar, { width: '90%' }]} />
        <View style={[styles.bar, styles.time, { width: 56 }]} />
      </View>
    </View>
  );
}

export function NotificationSkeleton() {
  return (
    <View>
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  body: { flex: 1, gap: 8, paddingTop: 2 },
  bar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  time: { height: 10, marginTop: 2 },
});
