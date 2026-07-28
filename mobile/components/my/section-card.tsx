import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

// 마이페이지의 카드 한 장. 웹 모바일 마이페이지와 같은 결
// (제목 + 오른쪽 화살표가 달린 줄 목록).

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
  /** danger는 되돌리기 어려운 동작(탈퇴)에만 쓴다. */
  tone?: 'default' | 'danger';
}

export function SectionRow({ label, onPress, tone = 'default' }: SectionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[styles.rowLabel, tone === 'danger' && styles.rowLabelDanger]}>{label}</Text>
      <IconSymbol name="chevron.right" size={22} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.5,
  },
  rowLabel: {
    fontSize: 16,
    color: '#111827',
  },
  rowLabelDanger: {
    color: '#DC2626',
  },
});
