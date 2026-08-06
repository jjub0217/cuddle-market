import { PawPrint, SearchX, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
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

// 빈 화면·오류 화면의 그림.
//
// ⚠️ **이모지(🐾 ⚠️)를 쓰지 않는다.** 세 가지 때문이다:
//   ① 기기마다 다르게 그려진다 — 삼성·구글이 각각 다른 그림을 쓴다. 우리가 못 정한다
//   ② 색이 박혀 있어 **브랜드 색을 못 입힌다**. 웹은 #825500 으로 그린다
//   ③ 앱에서 여기만 이모지였다 — 다른 32개 파일은 전부 lucide 아이콘이다
//
// 발자국은 버리지 않았다. lucide 의 PawPrint 로 바꿨을 뿐이다 — 같은 그림인데
// 색과 크기를 정할 수 있다. 반려동물 서비스다운 그림이라 지킬 값어치가 있다.
//
// 원 안에 넣는 모양은 웹과 같다
// (src/features/home/components/product-section/ProductsSection.tsx:131).

/** 브랜드 갈색. 웹 primary-700 과 같은 값이다. */
const ICON_COLOR = '#825500';
/** 아이콘을 감싸는 연한 원. 웹과 같은 값이다. */
const ICON_BG = '#FFF5E0';

function IconCircle({ children, label }: { children: ReactNode; label: string }) {
  // 그림에 이름을 붙인다. 화면을 읽어주는 기능이 이걸 말해 주고,
  // 시험도 이 이름으로 「어떤 그림인지」를 지킨다(그림 자체는 못 읽는다).
  return (
    <View style={styles.iconCircle} accessibilityLabel={label}>
      {children}
    </View>
  );
}

interface EmptyStateProps {
  /** 화면마다 다른 한 줄. 넘기지 않으면 홈 문구를 쓴다. */
  title?: string;
  description?: string;
  /**
   * 그림. 기본은 발자국이다.
   *
   * `search` 는 **찾았는데 없을 때** 쓴다(검색어·필터). 「아직 아무것도 없다」와
   * 「찾는 것이 없다」는 다른 말이라 그림도 달라야 한다.
   */
  icon?: 'paw' | 'search';
}

/** 빈 상태: 성공했으나 목록 0개. 오류와 명확히 구분. */
export function EmptyState({
  title = '아직 등록된 상품이 없어요.',
  description = '첫 상품이 올라오면 여기에서 보여드릴게요.',
  icon = 'paw',
}: EmptyStateProps) {
  return (
    <View style={styles.centered}>
      <IconCircle label={icon === 'search' ? '검색 결과 없음' : '발자국'}>
        {icon === 'search' ? (
          <SearchX size={36} strokeWidth={1.5} color={ICON_COLOR} />
        ) : (
          <PawPrint size={36} strokeWidth={1.5} color={ICON_COLOR} />
        )}
      </IconCircle>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{description}</Text>
    </View>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
  /** 화면마다 다른 한 줄. 넘기지 않으면 홈 문구를 쓴다. */
  title?: string;
}

/** 오류 상태: 첫 로드 실패. 전체 화면 + 다시 시도 버튼. */
export function ErrorState({ onRetry, title = '상품을 불러오지 못했어요.' }: ErrorStateProps) {
  return (
    <View style={styles.centered}>
      <IconCircle label="오류">
        <TriangleAlert size={36} strokeWidth={1.5} color={ICON_COLOR} />
      </IconCircle>
      <Text style={styles.emptyTitle}>{title}</Text>
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
  // 웹과 같은 모양 — 연한 원 안에 아이콘. 웹은 80이지만 폰이라 조금 작게 잡았다.
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_BG,
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
