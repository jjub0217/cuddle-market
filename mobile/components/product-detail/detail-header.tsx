import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';

// 상세 화면 헤더(뒤로가기만, 타이틀 없음 — 설계 §4).
//
// 왜 네이티브 스택 헤더를 안 쓰나:
// 실기기에서 상태바(시계·배터리)와 뒤로가기 화살표가 붙어 보였는데,
// expo-router가 쓰는 @react-navigation/native-stack에는 상단 인셋을 지정하는
// 옵션(headerStatusBarHeight)이 없어 앱에서 고칠 방법이 없다.
// 그래서 홈 화면과 똑같이 SafeAreaView로 직접 인셋을 먹는 방식으로 통일한다.
// (홈: mobile/app/(tabs)/(home)/index.tsx 의 헤더와 높이·테두리를 맞춤)

/** 헤더 막대 높이. 홈 헤더(52)와 같은 값이라 화면 전환 시 위치가 흔들리지 않는다. */
const HEADER_HEIGHT = 52;

interface Props {
  /**
   * 넘기면 오른쪽에 ⋮ 가 붙는다. 안 넘기면 안 그린다 —
   * 내 상품일 때는 신고·차단이 의미가 없어서 부르는 쪽이 뺀다(#805).
   */
  onMorePress?: () => void;
}

export function DetailHeader({ onMorePress }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        // 아이콘이 작아 손가락으로 누르기 쉽도록 터치 영역을 넓힌다.
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
      >
        <ChevronLeft size={26} color="#111827" />
      </Pressable>

      {onMorePress ? (
        <Pressable
          onPress={onMorePress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="더보기"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <EllipsisVertical size={24} color="#111827" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backPressed: {
    opacity: 0.5,
  },
});
