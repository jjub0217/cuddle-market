import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// 뒤로/닫기가 있는 화면들의 헤더. 탭 화면은 이것 말고 app-header.tsx 를 쓴다
// (뒤로가 없어 틀이 다르다 — 왼쪽에 로고나 제목이 온다).
//
// 왜 조각으로 모았나: 아홉 화면이 같은 마크업을 각자 베껴 두고 있어서 모습이 세 갈래로
// 갈렸다(제목이 왼쪽 18 · 가운데 20 · 아예 없음). 갈린 것을 눈으로 맞추는 것보다
// 한 곳에서 나오게 하는 편이 다음 화면까지 지켜 준다. 실제로 #838 에서 새 화면을 더하며
// 헤더 등록을 빠뜨려 뒤로 아이콘과 제목이 두 겹으로 보인 적이 있다(#841).
//
// 헤더를 화면이 직접 그리는 이유는 그대로다 — native-stack 헤더에는 상단 인셋 옵션이 없어
// 실기기에서 상태바에 붙어 보인다. 그래서 SafeAreaView(top) 아래 이 조각을 놓는다.

/** 앱의 모든 헤더가 같은 높이다. 화면을 옮겨 다닐 때 헤더가 들썩이면 안 된다. */
export const SCREEN_HEADER_HEIGHT = 52;

interface Props {
  /**
   * 화면 이름. 「지금 어디에 있는가」를 알린다 — 본문 제목(무엇을 하는가)과 다른 일이다.
   *
   * 주지 않으면 제목 없이 아이콘만 있는 막대가 된다. 이름이 본문 맨 위에 크게 나오는
   * 상세 화면이 그렇다 — 헤더에 또 쓰면 같은 말이 두 번이고, 긴 이름은 잘린다.
   */
  title?: string;
  /**
   * 왼쪽 아이콘을 눌렀을 때. 주지 않으면 아이콘을 그리지 않는다
   * (소셜 추가정보처럼 건너뛸 수 없는 화면).
   */
  onPressIcon?: () => void;
  /** 되돌아가는 화면은 back(‹), 끝내고 닫는 화면은 close(✕) */
  icon?: 'back' | 'close';
  /** 오른쪽에 붙는 것. 알림의 「모두 읽음」 같은 것 */
  right?: ReactNode;
  /**
   * 제목 자리. 기본은 화면 한가운데다.
   *
   * left 는 아이콘 바로 옆에 붙인다. **글자 크기는 그대로 20이다** — 자리만 옮긴다.
   * 오른쪽에 누를 것이 있어 가운데 제목이 둘 사이에 끼어 보이는 화면에 쓴다
   * — 알림(「모두 읽음」)이 그렇다.
   */
  align?: 'center' | 'left';
  /**
   * 아래 선. 기본은 그린다.
   *
   * 아래가 목록·스크롤인 화면(알림·답글·신고·상품 등록)은 선이 「여기부터 내용」을 알린다.
   * 반대로 인증 화면(로그인·회원가입)은 흰 화면 한 장에 내용이 가운데로 모여 있어
   * 선이 화면을 가로로 자른다 — 그쪽은 false 로 끈다.
   */
  divider?: boolean;
}

export function ScreenHeader({
  title,
  onPressIcon,
  icon = 'back',
  right,
  divider = true,
  align = 'center',
}: Props) {
  return (
    <View style={[styles.header, divider && styles.headerDivider]}>
      {onPressIcon ? (
        <Pressable
          onPress={onPressIcon}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={icon === 'close' ? '닫기' : '뒤로'}
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          {icon === 'close' ? (
            <X size={24} color={ICON_COLOR} />
          ) : (
            <ChevronLeft size={26} color={ICON_COLOR} />
          )}
        </Pressable>
      ) : null}

      {!title ? null : align === 'left' ? (
        /* 아이콘 옆에 붙인다. 줄 안에 있으므로 오른쪽 것과 자리를 나눠 쓴다 */
        <Text style={[styles.title, styles.titleLeft]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        /* 제목은 줄 안에서 밀어 넣지 않고 **화면 한가운데**에 놓는다.
           줄 안에 두면 왼쪽 아이콘과 오른쪽 것의 폭에 따라 좌우로 흔들린다.
           pointerEvents="none" — 글자가 아이콘의 누름 영역(hitSlop 12)을 가리면 안 된다. */
        <View style={styles.titleBox} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}

      {/* 오른쪽 것을 줄 끝으로 민다. 없어도 자리를 차지하지 않는다 */}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

/** 웹의 --color-header-icon 과 같은 값(app-header.tsx 와도 같다) */
const ICON_COLOR = '#111827';

const styles = StyleSheet.create({
  header: {
    height: SCREEN_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    // 탭 화면의 AppHeader 와 같은 16. 화면을 옮겨 다닐 때 아이콘의 왼쪽 시작선이
    // 흔들리면 안 된다. (전에는 화면마다 12와 16이 섞여 있었다)
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  headerDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  titleBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // 좌우 아이콘 자리를 비켜 준다. 제목이 길면 이 안에서 …으로 잘린다
    paddingHorizontal: 56,
  },
  // 홈·마이 헤더 제목과 같은 20이다(app-header.tsx 의 title)
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  // 자리만 옮긴다. 크기(20)는 가운데일 때와 같아야 화면을 오갈 때 글자가 들썩이지 않는다
  titleLeft: { marginLeft: 8, flexShrink: 1 },
  right: { marginLeft: 'auto' },
  pressed: { opacity: 0.5 },
});
