import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, type LucideIcon } from 'lucide-react-native';

import { colors } from '@/constants/colors';

// 마이페이지의 카드 한 장. 웹 모바일 마이페이지(MyPage.tsx의 md:hidden 블록)와
// 같은 결 — 제목 + 「왼쪽 아이콘 · 이름 · 오른쪽 화살표」로 된 줄 목록.
//
// 한때 왼쪽 아이콘이 없었다. 웹을 데스크탑 폭으로만 보고 옮긴 탓인데,
// 데스크탑 메뉴(myPageIconMap)는 `hidden md:flex`라 모바일에서 안 보이고
// 모바일에는 따로 아이콘 달린 목록이 있다. 판단해서 뺀 게 아니라 못 본 것이었다(#806).

// 색은 앱이 지금 쓰는 무채색 그대로다. 웹 토큰(text-on-surface 등)에 맞추는 일은
// #786(앱 색 토큰 체계 도입)에서 통째로 다룬다.
const LABEL = colors.onSurface;

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

interface SectionRowProps {
  label: string;
  onPress: () => void;
  /**
   * 줄 왼쪽 아이콘. 웹 모바일과 같은 것을 넘긴다(판매=Tag · 구매=Handbag · 찜=Heart …).
   *
   * 안 넘겨도 된다 — 개인정보처리방침·계정 삭제 안내는 **앱에만 있는 줄**이라
   * 웹에서 가져올 아이콘이 없다. 없는 것을 지어내기보다 비워 두기로 했다.
   */
  icon?: LucideIcon;
  /** danger는 되돌리기 어려운 동작(탈퇴)에만 쓴다. */
  tone?: 'default' | 'danger';
}

export function SectionRow({ label, onPress, icon: Icon, tone = 'default' }: SectionRowProps) {
  // 아이콘도 글자와 같은 색을 쓴다 — 탈퇴는 둘 다 빨강이라야 한 덩어리로 읽힌다.
  const color = tone === 'danger' ? colors.danger : LABEL;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {/* 크기·굵기는 웹 모바일과 같은 20 / 1.5다. */}
      {Icon ? <Icon size={20} strokeWidth={1.5} color={color} /> : null}
      <Text style={[styles.rowLabel, tone === 'danger' && styles.rowLabelDanger]}>{label}</Text>
      <ChevronRight size={22} color={colors.onSurfaceSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 웹 모바일의 gap-3과 같은 값. 아이콘이 없는 줄은 글자가 왼쪽 끝에서 시작한다.
    gap: 12,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.5,
  },
  rowLabel: {
    // 화살표를 오른쪽 끝으로 밀어낸다(웹도 이름 칸이 flex-1이다).
    flex: 1,
    fontSize: 16,
    color: LABEL,
  },
  rowLabelDanger: {
    color: colors.danger,
  },
});
