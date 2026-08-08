import { RotateCw } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

// 「현 지도에서 검색」. 지도를 손으로 옮겼을 때만 나타난다.
//
// 왜 자동으로 안 찾고 이 단추를 두나 — 지도를 옮기는 게 늘 「여기 찾아줘」는 아니다.
// 둘러보는 중일 수도 있고, 핀을 누르려다 손가락이 밀린 것일 수도 있다. 자동으로 찾으면
// 그 셋을 구분 못 하고 **목록이 멋대로 바뀐다.** 읽던 중이었다면 방금 본 곳을 놓친다.
// 웹·네이버지도·카카오맵이 모두 이 방식이다.
//
// 문구는 웹(src/features/map/SearchInMapButton.tsx)과 **같다.**
// ⚠️ 자리는 다르다 — 웹은 아래 가운데, 앱은 **위 가운데**다. 앱은 아래를 목록 시트가
//    덮고 있어서 웹 자리를 그대로 못 쓴다. 네이버 지도 앱도 위에 둔다(설계 §5-1).

interface Props {
  onPress: () => void;
}

export function SearchInMapButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <RotateCw size={15} color={colors.onSurfaceStrong} />
      <Text style={styles.label}>현 지도에서 검색</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    // 지도 위에 떠 있다는 게 보여야 한다. 그림자가 없으면 지도에 묻힌다.
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: { opacity: 0.8 },
  // 목록 항목 이름(15/700)보다 작고 얌전하게 — 지도를 가리는 것이므로 주인공이 아니다.
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceStrong },
});
