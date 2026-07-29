import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TradeStatus } from '@/lib/product-actions';

// 목록 위 상태 필터. 웹의 Tabs variant="card-pill"과 같은 모양이다.
//
// 왜 드롭다운이 아닌가:
// 선택지가 넷뿐이라 한 줄에 다 보이고, 목록을 훑다가 바꾸는 동작이 한 번에 끝난다.
// 드롭다운은 열고 → 고르는 두 번이 든다.
//
// 왜 가로 스크롤이 아니라 줄바꿈인가:
// 웹도 flex-wrap이다. 가로 ScrollView를 쓰면 세로 크기가 정해지지 않아 남는 공간을
// 다 먹거나(빈 자리), 내용에 딱 맞추면 칩 테두리가 경계에 걸려 잘린다 — 둘 다 실기기에서 봤다.
// 칩이 넷뿐이라 좁은 화면에서는 다음 줄로 넘기면 충분하다.

export type StatusFilter = 'ALL' | TradeStatus;

export interface FilterChip {
  id: StatusFilter;
  label: string;
}

interface Props {
  chips: FilterChip[];
  activeId: StatusFilter;
  onChange: (id: StatusFilter) => void;
}

export function StatusFilterChips({ chips, activeId, onChange }: Props) {
  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // 좁은 화면에서는 다음 줄로 넘어간다. 웹의 flex-wrap과 같다.
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    // 웹은 px-5(20). 앱의 다른 영역이 16이라 여기도 16으로 맞춘다.
    paddingHorizontal: 16,
    paddingTop: 12,
    // 제목 영역이 위 여백 16을 갖고 있어 합치면 36이 된다.
    paddingBottom: 20,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    // 웹 card-pill의 선택 상태와 같은 값(border-[#825500] bg-[#825500]).
    backgroundColor: '#825500',
    borderColor: '#825500',
  },
  chipIdle: {
    // 웹은 연한 베이지 테두리(border-[#d4c4b2])라 선택된 칩이 더 도드라진다.
    backgroundColor: '#FFFFFF',
    borderColor: '#D4C4B2',
  },
  label: {
    fontSize: 14,
    // 웹은 모바일 폭에서 font-normal이다(max-md:font-normal).
    fontWeight: '400',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelIdle: {
    // 웹 text-gray-600.
    color: '#4B5563',
  },
  pressed: {
    opacity: 0.7,
  },
});
