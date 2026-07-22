import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// 홈 목록의 3상태(로딩/빈/오류) + 무한스크롤 footer 컴포넌트.
// 근거: 요구사항 §5, UI 스펙 §6. 세 상태는 서로 명확히 구분한다.

const SKELETON_COUNT = 7; // 카드 스켈레톤 6~8개(UI 스펙 §6.1)

// 카드 하나 골격의 회색 뼈대(무한 스피너 금지).
function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.skelThumb} />
      <View style={styles.skelInfo}>
        <View style={styles.skelBadgeRow}>
          <View style={[styles.skelBar, { width: 40 }]} />
          <View style={[styles.skelBar, { width: 56 }]} />
        </View>
        <View style={[styles.skelBar, { width: '90%' }]} />
        <View style={[styles.skelBar, { width: '60%' }]} />
        <View style={[styles.skelBar, styles.skelPrice, { width: 80 }]} />
        <View style={[styles.skelBar, { width: '70%' }]} />
      </View>
    </View>
  );
}

/** 첫 진입 로딩: 카드 스켈레톤 여러 개(전체 화면). */
export function LoadingState() {
  return (
    <View style={styles.listPadding}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** 빈 상태: 성공했으나 목록 0개. 오류와 명확히 구분. */
export function EmptyState() {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>🐾</Text>
      <Text style={styles.emptyTitle}>아직 등록된 상품이 없어요.</Text>
      <Text style={styles.emptySub}>첫 상품이 올라오면 여기에서 보여드릴게요.</Text>
    </View>
  );
}

/** 오류 상태: 첫 로드 실패. 전체 화면 + 다시 시도 버튼. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>상품을 불러오지 못했어요.</Text>
      <Text style={styles.emptySub}>네트워크를 확인하고 다시 시도해 주세요.</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
        <Text style={styles.retryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

/** 무한스크롤 footer: 다음 페이지 로딩 중일 때만 "더 불러오는 중". */
export function ListFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color="#9CA3AF" />
      <Text style={styles.footerText}>더 불러오는 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listPadding: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  retryBtnPressed: {
    opacity: 0.85,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // ---- 스켈레톤 ----
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  skelThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  skelInfo: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  skelBadgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  skelBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  skelPrice: {
    height: 16,
  },
});
