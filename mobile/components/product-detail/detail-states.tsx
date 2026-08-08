import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

// 상세 화면의 로딩·없음·오류 상태. 홈의 list-states와 같은 결로 맞춘다.

/** 목록 캐시가 없어 아무것도 못 그릴 때 보이는 회색 자리. */
export function DetailSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={[styles.bar, { width: '40%' }]} />
        <View style={[styles.bar, { width: '80%', height: 22 }]} />
        <View style={[styles.bar, { width: '35%', height: 20 }]} />
        <View style={[styles.bar, { width: '55%' }]} />
      </View>
    </View>
  );
}

/** 삭제되었거나 없는 상품(404). */
export function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>삭제되었거나 없는 상품이에요</Text>
      <Pressable style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>목록으로</Text>
      </Pressable>
    </View>
  );
}

/** 네트워크·서버 오류. */
export function DetailErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>상품을 불러오지 못했어요</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: {
    flex: 1,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.outlineVariant,
  },
  skeletonBody: {
    padding: 16,
    gap: 10,
  },
  bar: {
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.outlineVariant,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  // 19바퀴(#786)에 주황에서 먹색으로 옮겼다. 목록 화면의 「다시 시도」는
  // 파랑, 여기는 주황이라 **같은 글자의 단추가 화면마다 달랐다**.
  button: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.action,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onAction,
  },
});
