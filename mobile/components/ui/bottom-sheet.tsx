import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 아래에서 올라오는 시트의 껍데기. 안에 무엇을 담을지는 쓰는 쪽이 정한다.
//
// 원래 product-action-sheet.tsx 안에만 있던 것을 빼냈다. 회원가입의 거주지 선택도
// 같은 모양이어야 해서다 — 두 시트가 따로 놀면 같은 앱으로 안 보인다.
//
// ⚠️ **여섯 곳이 같이 쓴다.** 상품 등록의 고르는 칸 · 지역 고르기 · 정렬 목록 ·
//    세부 필터 · 상품 ⋮ 메뉴. 여기를 고치면 다섯 곳이 같이 바뀐다.
//
// 왜 Modal의 animationType="slide"를 안 쓰나:
// 그 값은 길이·곡선을 정할 수 없고, 실기기에서 올라오는 속도가 툭 튀어 보였다.
// animationType="none"으로 두고 직접 움직인다.
//
// 왜 내장 Animated 대신 Reanimated인가(#855 후속):
// 손가락으로 끌어 닫는 동작이 붙었다. 끄는 동안 매 프레임 시트를 따라 움직여야 하는데,
// 내장 Animated는 그 값을 자바스크립트 쪽에서 만들어 넘겨 안드로이드에서 손을 따라오지
// 못한다. 제스처(react-native-gesture-handler)와 Reanimated는 같은 UI 쓰레드에서 돌아
// 손에 붙는다. 앱에 이미 둘 다 있다(지도의 place-sheet.tsx가 먼저 썼다).

// 열고 닫는 시간을 **가야 할 거리에 맞춘다**.
//
// ⚠️ 시간을 하나로 못 박으면 **큰 시트일수록 빨라진다.** 같은 시간에 더 먼 거리를 가기 때문이다.
//    ```
//    상품 ⋮ 메뉴    높이 168 → 300ms 에 168 이동   초당 560
//    세부 필터 시트  높이 550 → 300ms 에 550 이동   초당 1830   ← 세 배 빠르다
//    ```
//    그래서 작은 시트는 멀쩡한데 세부 필터 시트만 「확 급하게 나타난다」로 보였다
//    (2026-08-06 실기기). 속도를 맞추면 크기가 달라도 같은 느낌으로 움직인다.
//
// 열 때는 조금 느긋하게, 닫을 때는 빠르게 — 닫기는 이미 결정한 동작이라 기다릴 이유가 없다.

/** 열 때 1dp를 가는 데 쓰는 시간(ms). 커질수록 느긋해진다. */
const OPEN_MS_PER_DP = 0.8;
/** 닫을 때. 열 때보다 빠르다. */
const CLOSE_MS_PER_DP = 0.45;

/**
 * 아무리 짧아도·길어도 이 사이다.
 *
 * 아래를 두는 이유: 아주 낮은 시트가 눈에 안 띄게 지나가면 안 된다.
 * 위를 두는 이유: 화면을 거의 덮는 시트가 굼떠 보이면 안 된다.
 * (첫 열림에는 아직 높이를 못 재서 화면 높이로 잡히는데, 그때 위 한계가 걸린다)
 */
const OPEN_MS_RANGE = { min: 300, max: 520 };
const CLOSE_MS_RANGE = { min: 200, max: 340 };

/** 갈 거리에 맞는 시간. 제스처(UI 쓰레드)에서도 부르므로 worklet이다. */
function 걸리는시간(거리: number, msPerDp: number, 범위: { min: number; max: number }) {
  'worklet';
  return Math.min(범위.max, Math.max(범위.min, 거리 * msPerDp));
}

/**
 * 시트가 차지할 수 있는 최대 높이(화면 대비).
 * 위쪽에 화면이 조금 남아야 「덮개 위에 뜬 시트」로 읽힌다 — 다 덮으면 새 화면처럼 보인다.
 * 여기서 끊어 두면 내용이 아무리 길어도 시트가 화면을 넘지 않고, 안쪽 스크롤이 대신 줄어든다.
 */
const MAX_HEIGHT_RATIO = 0.85;

/**
 * 손잡이에서 아래로 이만큼(dp) 쓸면 닫는다. **살짝만 쓸어도 닫히는** 값이다.
 *
 * ⚠️ 시트 높이의 비율이 아니라 고정 거리다. 시트가 손을 따라 움직이지 않으니
 *    「시트가 얼마나 왔나」가 아니라 「손이 얼마나 쓸었나」만 보면 되고, 손이 움직인
 *    거리는 시트 크기와 상관없다.
 */
const DRAG_CLOSE_DP = 12;

/** 위로 쓰는 것은 안 받는다는 뜻의 큰 값. 시트는 이미 다 올라와 있어 더 갈 데가 없다. */
const WON_T_ACTIVATE = 10000;

/** 시험이 끌기 제스처를 집을 때 쓰는 이름. */
export const DRAG_TEST_ID = 'bottom-sheet-drag';

interface Props {
  visible: boolean;
  onClose: () => void;
  /**
   * 손잡이를 달고, **그 손잡이를 아래로 끌면 닫히게** 한다.
   *
   * ⚠️ 왜 시트 아무 데나가 아니라 손잡이인가(#855에서 고른 길 ①):
   * 안이 스크롤되는 시트(세부 필터)에서 내용 위를 아래로 끌면 「목록을 굴리려는 것」인지
   * 「시트를 닫으려는 것」인지 가릴 수 없다. 둘 다 받으려 하면 굴리다가 시트가 닫히거나,
   * 반대로 닫으려는데 목록만 움직인다. 손잡이에서만 받으면 헷갈릴 일이 없고, iOS 기본
   * 시트도 이 방식이다. (다른 길 ②는 「스크롤이 맨 위일 때만 끌면 닫힌다」인데, 손이
   * 한 번 더 가고 맨 위인지 아닌지를 사용자가 알 수 없어 안 골랐다.)
   *
   * 손잡이가 없던 다섯 시트는 이 값을 안 주므로 지금까지와 똑같이 돈다.
   */
  dragToClose?: boolean;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, dragToClose = false, children }: Props) {
  // 기기 아래쪽 안전영역(제스처 바·내비게이션 바)의 높이. 바가 없는 기기에서는 0이다.
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // Modal을 언제 떼어낼지. 닫는 애니메이션이 끝난 뒤에 떼어야 사라지는 모습이 보인다.
  const [mounted, setMounted] = useState(visible);

  /**
   * 「숨은 자리」 — 시트가 화면 밖으로 완전히 내려갔을 때의 거리.
   *
   * ⚠️ 재기 전에는 **화면 높이**를 쓴다. 예전에는 320을 못 박아 뒀는데, 그보다 큰 시트는
   *    320만 내려간 채로 시작해 **나머지가 이미 화면에 보인 상태**에서 올라왔다 —
   *    세부 필터 시트(높이 550쯤)가 「갑자기 튀어나온다」로 보인 까닭이다(#855).
   *    화면 높이만큼 내려놓으면 크기가 얼마든 확실히 밖에서 시작한다.
   */
  const hiddenY = useSharedValue(screenHeight);
  /** 지금 시트가 내려가 있는 거리. 0이면 다 올라온 상태다. */
  const translateY = useSharedValue(screenHeight);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, {
        duration: 걸리는시간(hiddenY.value, OPEN_MS_PER_DP, OPEN_MS_RANGE),
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    translateY.value = withTiming(
      hiddenY.value,
      {
        duration: 걸리는시간(hiddenY.value, CLOSE_MS_PER_DP, CLOSE_MS_RANGE),
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      }
    );
  }, [visible, translateY, hiddenY]);

  /**
   * 손잡이를 잡고 **아래로 살짝만 쓸어도 곧바로 닫는다.**
   *
   * ⚠️ **손을 뗄 때까지 기다리지 않는다.** 예전에는 손을 따라 내려오다가 손을 떼는 순간
   *    「충분히 내렸나」를 재서 닫거나 제자리로 돌려놨다. 그러면 미는 동안 아무 결론이
   *    안 나서 「1~2초 뒤에야 내려간다」로 느껴졌다(2026-08-06 실기기).
   *
   * ⚠️ 그래서 **손을 따라 움직이는 부분도, 제자리로 돌아가는 부분도 없다.** 쓸어내리는
   *    순간 닫히기로 정해지므로 시트가 중간에 걸쳐 있을 자리가 아예 생기지 않는다.
   *
   * 위로 쓰는 것은 받지 않는다 — 시트는 이미 다 올라와 있어 더 갈 데가 없다.
   */
  const pan = Gesture.Pan()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(bottom-sheet.test.tsx).
    .withTestId(DRAG_TEST_ID)
    .activeOffsetY([-WON_T_ACTIVATE, DRAG_CLOSE_DP])
    .onStart(() => {
      // 여기 왔다는 것은 이미 아래로 DRAG_CLOSE_DP 만큼 쓸었다는 뜻이다.
      // 직접 내리지 않고 알리기만 한다 — 알리면 쓰는 쪽이 visible을 내리고,
      // 위 useEffect가 늘 하던 대로 내려 준다. 닫는 움직임이 한 곳에만 있다.
      runOnJS(onClose)();
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 덮개는 시트를 따라 짙어지고 옅어진다. 끌어 내리는 동안에도 같이 옅어져야
  // 「내가 닫고 있다」는 게 손에 보인다.
  const backdropStyle = useAnimatedStyle(() => {
    const 올라온정도 = hiddenY.value > 0 ? 1 - translateY.value / hiddenY.value : 1;
    return { opacity: Math.min(1, Math.max(0, 올라온정도)) };
  });

  const 껍데기 = (
    <View style={styles.backdrop}>
      {/*
        취소 버튼을 따로 두지 않는다. 바깥을 누르면 닫힌다.

        ⚠️ **누름판을 시트 아래에 따로 깐다. 시트를 감싸지 않는다.**
           예전에는 이 누름판이 시트까지 감싸고, 시트 안에 또 하나(onPress={})를 둬서
           바깥 누름을 막았다. 그런데 RN은 터치를 다루는 계통이 둘이고(누름판 쪽과
           제스처 쪽), 손가락을 대면 양쪽이 서로 받겠다고 겨룬다. 손가락이 움직여야
           누름판이 물러나는데 그 판정 동안 **끌기가 한 박자 밀린다** —
           「내려가다 한 번 멈춘다」로 보였다(2026-08-06 실기기).

           시트를 누름판 **위에** 얹으면 시트를 눌러도 누름판에 안 닿는다. 그래서
           시트 안 누름판이 아예 필요 없어지고, 겨룰 일도 없어진다.
      */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기">
        <Animated.View style={[styles.backdropFill, backdropStyle]} />
      </Pressable>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View
          // 안전영역 여백을 「재는 상자」인 여기에 준다. 바깥 Animated.View에 주면
          // onLayout이 재는 높이에 안 잡혀, 올라오기 전 시트가 그 높이만큼
          // 덜 내려가 화면 아래에 미리 비죽 나와 보인다.
          style={{
            paddingBottom: insets.bottom,
            // 여기서 끊어야 안쪽 스크롤이 줄어들 자리를 안다(MAX_HEIGHT_RATIO 설명 참고).
            maxHeight: Math.round(screenHeight * MAX_HEIGHT_RATIO),
          }}
          // 재고 나면 정확한 높이를 쓴다. 상태로 두지 않는 이유: 여기서 다시 그릴 필요가
          // 없다. 값이 쓰이는 곳은 움직임뿐이라 공유값에 바로 넣는다.
          onLayout={(event) => {
            hiddenY.value = event.nativeEvent.layout.height;
          }}
        >
          {dragToClose ? (
            <GestureDetector gesture={pan}>
              {/* 눈에 보이는 막대보다 넓게 잡는다 — 얇은 막대만 노리면 「안 끌린다」로
                  느껴진다(지도 시트에서 실제로 겪었다). */}
              <View style={styles.handleArea} accessibilityLabel="끌어내려 닫기">
                <View style={styles.handle} />
              </View>
            </GestureDetector>
          ) : null}
          {children}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* ⚠️ 안드로이드에서는 Modal 안이 별도의 창이라, 앱 바깥(app/_layout.tsx)에 씌운
          GestureHandlerRootView가 여기까지 닿지 않는다. 다시 감싸지 않으면 **오류 없이
          조용히 안 끌린다.** 공식 설치 문서가 시키는 대로다.
          끌지 않는 다섯 시트에는 씌우지 않는다 — 안 쓰는 곳의 터치 흐름까지 건드릴
          이유가 없다. */}
      {dragToClose ? (
        <GestureHandlerRootView style={styles.gestureRoot}>{껍데기}</GestureHandlerRootView>
      ) : (
        껍데기
      )}
    </Modal>
  );
}

/** 시트 안 항목의 공용 모양. 두 시트가 같은 값을 쓴다. */
export const sheetItemStyles = StyleSheet.create({
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  itemPressed: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 16,
    color: '#111827',
  },
});

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  /** 덮개 색을 따로 둔 이유: 시트와 같이 서서히 짙어지게 하려고 투명도를 애니메이션한다. */
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    // 앱의 다른 모달 세 곳(로그아웃 · 탈퇴 · 삭제 확인)과 같은 값.
    // 웹 모달의 backdrop:bg-gray-900/70 과도 같다.
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    // 아래는 화면 끝에 붙으므로 위쪽 모서리만 둥글게.
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    // 모양을 내기 위한 위아래 여백은 두지 않는다.
    // 여백이 있으면 첫·마지막 항목만 구분선 바깥으로 더 넓어 보인다 — 실기기에서
    // "삭제 버튼만 높아 보인다"로 나타났다. 항목 높이 56이 넉넉해 여백이 따로 필요 없다.
    //
    // 다만 안전영역(insets.bottom)만큼은 위쪽 Pressable에서 아래에 더한다(#843).
    // 예전에는 「안드로이드 RN Modal은 내비게이션 바 아래까지 안 그리니 더하면 빈 자리만
    // 남는다」고 적혀 있었는데, 그건 Expo Go에서만 맞는 이야기였다. app.json의
    // edgeToEdgeEnabled: true가 Expo Go에는 안 먹어 거기서는 insets.bottom이 늘 0이었다.
    // 개발·출시 빌드에서는 24~48이 들어오고 Modal이 바 아래까지 그려서, 안 더하면
    // 마지막 항목이 제스처 바에 가린다. 되돌리기 전에 반드시 개발 빌드로 확인할 것.
  },
  // 잡는 자리. 위아래로 넉넉히 벌려 손가락이 닿게 한다.
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
});
