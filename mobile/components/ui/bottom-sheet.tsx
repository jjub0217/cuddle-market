import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
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
 * 손을 떼는 순간 아래로 이만큼(dp) 넘게 와 있으면 닫는다. 못 미치면 제자리로 돌아간다.
 *
 * 시트 높이의 비율이 아니라 **고정 거리**인 이유: 큰 시트든 작은 시트든 「닫으려고 미는
 * 손의 크기」는 같다. 비율로 두면 낮은 시트는 손가락만 얹어도 닫히고, 큰 시트는 화면
 * 절반을 끌어내려야 닫힌다.
 */
const DRAG_CLOSE_DP = 56;

/** 조금만 밀었어도 이보다 빠르게 튕겨 내리면 닫는다(초당 몇 점). 「휙 내리기」를 받아 준다. */
const FLING_VELOCITY = 800;

/**
 * 덜 밀고 놓았을 때 제자리(0)로 돌아가는 시간.
 *
 * 여는 것보다 짧은 범위를 쓴다 — 되돌아가는 거리는 길어야 56dp 남짓이라, 여는 범위
 * (최소 300ms)를 그대로 쓰면 「손을 놓고 한참 뒤에야 붙는다」로 보인다.
 */
const RETURN_MS_RANGE = { min: 120, max: 240 };

/** 시험이 끌기 제스처를 집을 때 쓰는 이름. */
export const DRAG_TEST_ID = 'bottom-sheet-drag';

/** 시험이 **움직이는 상자**를 집을 때 쓰는 이름. 얼마나 내려가 있는지를 여기서 읽는다. */
export const SHEET_TEST_ID = 'bottom-sheet-box';

/** 그려진 안쪽 스크롤 그 자체(Animated.ScrollView 의 알맹이). */
type 스크롤알맹이 = ComponentRef<typeof Animated.ScrollView>;

/**
 * 시트 안쪽 스크롤과 시트 끌기를 이어 주는 자리.
 *
 * 껍데기(BottomSheet)가 넣어 주고, 안쪽 스크롤(SheetScrollView)이 꺼내 쓴다.
 * 안쪽이 스크롤되는 시트는 「지금 스크롤이 어디쯤인지」를 껍데기가 알아야 끌기와
 * 굴리기를 가를 수 있다(아래 SheetScrollView 설명).
 */
interface 시트속스크롤 {
  scrollRef: RefObject<스크롤알맹이 | null>;
  /** 안쪽 스크롤이 맨 위에서 얼마나 내려가 있나. 0이면 맨 위다. */
  scrollY: SharedValue<number>;
}

const SheetScrollContext = createContext<시트속스크롤 | null>(null);

/**
 * 시트 안에서 쓰는 스크롤. 그냥 `ScrollView` 대신 이걸 쓴다.
 *
 * 하는 일은 둘뿐이다 — 스크롤 자리를 껍데기에 알려 주고, 자기 자신을 껍데기의 끌기
 * 제스처에 소개해 준다(`simultaneousWithExternalGesture`). 그래야 아래 규칙이 선다.
 *
 * ```
 * 스크롤이 맨 위 + 아래로 밀기   →  시트가 손을 따라 내려간다
 * 그 밖(중간이거나 위로 밀기)     →  안쪽 내용이 굴러간다
 * ```
 *
 * ⚠️ **왜 `onScroll`을 그냥 함수로 안 받고 `useAnimatedScrollHandler`인가:**
 *    보통 `onScroll`은 자바스크립트 쪽에서 돈다. 그런데 끌기 판정은 손가락 쪽(UI 쓰레드)에서
 *    매 프레임 일어나므로, 자바스크립트를 거쳐 온 값은 한 박자 늦은 옛 값이다. 이 훅으로
 *    받으면 값이 UI 쓰레드의 공유값에 바로 담겨 제스처와 같은 박자로 읽힌다.
 *
 * ⚠️ **끝에서 튕기는 것(bounces)을 끈다.** 시트를 끌어 내리는 동안 안쪽 내용까지 같이
 *    늘어지면 두 개가 따로 움직이는 것처럼 보인다.
 */
export function SheetScrollView(props: ComponentProps<typeof Animated.ScrollView>) {
  const 시트속 = useContext(SheetScrollContext);
  // 시트 밖에서 써도 터지지 않게 둘 자리. 시트 안이면 껍데기 것을 쓴다.
  const 혼자쓸값 = useSharedValue(0);
  const scrollY = 시트속?.scrollY ?? 혼자쓸값;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      bounces={false}
      overScrollMode="never"
      {...props}
      // ⚠️ 이 셋은 받은 값 **뒤**에 둔다. 앞에 두면 쓰는 쪽이 실수로 onScroll을 넘겼을 때
      //    이걸 덮어써서, 오류 없이 조용히 끌기와 굴리기가 안 갈린다.
      ref={시트속?.scrollRef}
      onScroll={onScroll}
      // 16 = 한 프레임(60fps)마다. 기본값(0)이면 스크롤이 끝나야 한 번 온다.
      scrollEventThrottle={16}
    />
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /**
   * 손잡이를 달고, **시트 아무 데나 아래로 끌면 손을 따라 내려가며 닫히게** 한다.
   *
   * 손잡이는 「여기 끌 수 있다」는 표시로만 남는다 — 잡는 자리는 시트 전체다.
   * 카카오맵·네이버지도의 목록 시트가 그렇다(2026-08-06 실기기 확인).
   *
   * 안이 스크롤되는 시트는 안쪽 스크롤을 `SheetScrollView`로 바꿔 준다. 그러면
   * 「스크롤이 맨 위일 때만 시트가 끌린다」로 갈라져 굴리기와 부딪히지 않는다.
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

  /**
   * 안쪽 스크롤과 이어 주는 두 값. 안이 안 굴러가는 다섯 시트에서는
   * scrollY가 0에 머무르고 scrollRef가 비어 있어, 시트 전체가 그냥 끌린다.
   */
  const scrollRef = useRef<스크롤알맹이 | null>(null);
  const scrollY = useSharedValue(0);
  // 둘 다 살아 있는 동안 안 바뀌는 값이라 한 번만 만들어 둔다 — 매번 새 객체를 넣으면
  // 안쪽 스크롤이 까닭 없이 다시 그려진다.
  const 시트속 = useRef<시트속스크롤>({ scrollRef, scrollY }).current;

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
        // ⚠️ 남은 거리로 잰다. 끌어 내리다 닫히면 시트는 이미 절반쯤 내려가 있는데,
        //    전체 거리로 시간을 잡으면 남은 조금을 가는 데 그 시간을 다 써서 굼떠 보인다.
        duration: 걸리는시간(
          Math.max(0, hiddenY.value - translateY.value),
          CLOSE_MS_PER_DP,
          CLOSE_MS_RANGE
        ),
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      }
    );
  }, [visible, translateY, hiddenY]);

  /** 덜 밀고 놓았을 때. 손을 뗀 자리에서 제자리(0)로 붙인다. */
  const 제자리로 = () => {
    'worklet';
    translateY.value = withTiming(0, {
      duration: 걸리는시간(translateY.value, OPEN_MS_PER_DP, RETURN_MS_RANGE),
      easing: Easing.out(Easing.cubic),
    });
  };

  /**
   * 「시트 끌기가 시작된 지점」. 손가락이 움직인 거리(translationY)에서 이만큼을 뺀 것이
   * 시트가 내려가야 할 거리다.
   *
   * 왜 0이 아닐 수 있나: 안쪽을 한참 굴리다가 손을 안 뗀 채로 맨 위까지 되돌아오면,
   * 그 순간 손가락은 이미 한참 움직인 뒤다. 그 값을 그대로 쓰면 시트가 **훌쩍 뛴다.**
   * 굴리는 동안 이 값을 손가락 자리에 붙여 두면, 맨 위에 닿은 그 자리부터 0에서 시작한다.
   */
  const 끌기시작 = useSharedValue(0);

  /**
   * 이번에 손을 댄 뒤로 시트가 **실제로** 손을 따라 내려간 적이 있나.
   *
   * ⚠️ 이게 없으면 굴리기만 했는데 닫힌다. 굴러가 있는 목록을 아래로 휙 튕기면 시트는
   *    가만히 있었는데도 손을 떼는 순간의 속도가 크다 — 그 속도만 보고 「휙 내렸다」로
   *    받아 버린다. 시트가 움직인 적이 없으면 손을 뗄 때 아무 일도 없어야 한다.
   */
  const 시트가움직였다 = useSharedValue(false);

  /**
   * 시트 끌기. **시트 아무 데서나** 받는다.
   *
   * ⚠️ 안쪽 스크롤과 어떻게 가르나 — `simultaneousWithExternalGesture`를 골랐다.
   *    - `Gesture.Native()` + `Gesture.Simultaneous`도 같은 일을 하지만, 스크롤을
   *      `GestureDetector`로 한 겹 더 감싸야 한다. 감싸는 쪽은 쓰는 사람(세부 필터 시트)이라
   *      빠뜨리기 쉽다. 지금 방식은 `SheetScrollView` 하나로 바꿔 끼우면 끝이다.
   *    - 「둘 중 하나만」(`blocksExternalGesture`)로 가르면 손을 뗐다 다시 대야 다른 쪽이
   *      먹는다. 카카오맵은 한 번 댄 손으로 굴리다 그대로 시트를 내릴 수 있다.
   *    그래서 **둘 다 살려 두고**, 어느 쪽이 움직일지는 아래 onUpdate에서 스크롤 자리를
   *    보고 정한다. 스크롤이 맨 위가 아니면 시트는 가만히 있고 안쪽만 굴러간다.
   */
  const pan = Gesture.Pan()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(bottom-sheet.test.tsx).
    .withTestId(DRAG_TEST_ID)
    // ⚠️ 타입만 갈아 끼운다. gesture-handler 는 「같이 돌 상대」를 컴포넌트 **종류**의
    //    ref 로 적어 두었는데, 실제로 넣어야 하는 것은 그려진 스크롤 그 자체다.
    //    값은 맞고 적힌 이름만 다르다. 안 굴러가는 다섯 시트에서는 비어(null) 있고,
    //    비어 있으면 라이브러리가 그냥 건너뛴다.
    .simultaneousWithExternalGesture(scrollRef as unknown as RefObject<ComponentType>)
    // 위아래로 10dp 넘게 움직여야 끌기로 친다. 시트 전체가 잡는 자리가 됐으니,
    // 알약이나 「적용」을 누를 때 손가락이 옆으로 조금 흔들려도 누르기가 살아 있어야 한다.
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      끌기시작.value = 0;
      시트가움직였다.value = false;
    })
    .onUpdate((event) => {
      // 안쪽이 아직 맨 위가 아니다 → 굴리는 중이다. 시트는 건드리지 않고,
      // 끌기 기준만 손가락을 따라 옮겨 둔다(위 끌기시작 설명).
      if (scrollY.value > 0) {
        끌기시작.value = event.translationY;
        translateY.value = 0;
        시트가움직였다.value = false;
        return;
      }
      // 위로 미는 것은 시트를 키우지 않는다 — 세부 필터 시트는 이미 최대 높이로 열려
      // 커질 자리가 없다. 위로 밀면 안쪽이 굴러가면 된다. 그래서 0 아래로는 안 간다.
      const 내려온거리 = Math.max(0, event.translationY - 끌기시작.value);
      translateY.value = 내려온거리;
      if (내려온거리 > 0) 시트가움직였다.value = true;
    })
    .onEnd((event) => {
      // 굴리기만 했다면 시트는 제자리 그대로다 — 손을 떼도 아무 일도 없어야 한다.
      if (!시트가움직였다.value) return;

      const 내려온거리 = Math.max(0, event.translationY - 끌기시작.value);
      const 닫을만큼밀었다 = 내려온거리 > DRAG_CLOSE_DP || event.velocityY > FLING_VELOCITY;

      // 닫을 때는 여기서 직접 내리지 않고 알리기만 한다. 알리면 쓰는 쪽이 visible을 내리고,
      // 위 useEffect가 늘 하던 대로 **지금 있는 자리에서 이어서** 내려 준다 —
      // 닫는 움직임이 한 곳에만 있다.
      if (닫을만큼밀었다) {
        runOnJS(onClose)();
        return;
      }
      // ⚠️ 손을 따라 움직이는 이상 이게 반드시 있어야 한다. 없으면 덜 민 시트가
      //    중간에 걸쳐 있는 채로 남는다.
      제자리로();
    })
    .onFinalize((_event, 제대로끝났다) => {
      끌기시작.value = 0;
      시트가움직였다.value = false;
      // 다른 제스처에 밀려 취소된 경우에도 걸쳐 있지 않게 한다.
      if (!제대로끝났다) 제자리로();
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

  const 재는상자 = (
    <Pressable
      // 안전영역 여백을 「재는 상자」인 여기에 준다. 바깥 Animated.View에 주면
      // onLayout이 재는 높이에 안 잡혀, 올라오기 전 시트가 그 높이만큼
      // 덜 내려가 화면 아래에 미리 비죽 나와 보인다.
      style={{
        paddingBottom: insets.bottom,
        // 여기서 끊어야 안쪽 스크롤이 줄어들 자리를 안다(MAX_HEIGHT_RATIO 설명 참고).
        maxHeight: Math.round(screenHeight * MAX_HEIGHT_RATIO),
      }}
      onPress={() => {}}
      // 재고 나면 정확한 높이를 쓴다. 상태로 두지 않는 이유: 여기서 다시 그릴 필요가
      // 없다. 값이 쓰이는 곳은 움직임뿐이라 공유값에 바로 넣는다.
      onLayout={(event) => {
        hiddenY.value = event.nativeEvent.layout.height;
      }}
    >
      {dragToClose ? (
        // 손잡이는 이제 **표시**다. 잡는 자리는 시트 전체라 여기만 노릴 필요가 없다.
        // 그래도 그린다 — 막대가 없으면 「끌 수 있다」는 걸 알 길이 없다.
        <View style={styles.handleArea} accessibilityLabel="끌어내려 닫기">
          <View style={styles.handle} />
        </View>
      ) : null}
      {children}
    </Pressable>
  );

  const 껍데기 = (
    /* 취소 버튼을 따로 두지 않는다. 바깥을 누르면 닫힌다. */
    <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기">
      <Animated.View style={[styles.backdropFill, backdropStyle]} />
      {/* 시트 안을 눌렀을 때 닫히지 않도록 바깥 Pressable의 터치를 여기서 멈춘다. */}
      <Animated.View testID={SHEET_TEST_ID} style={[styles.sheet, sheetStyle]}>
        {dragToClose ? (
          // 시트 통째로 끌기를 받는다. 누르기(적용·초기화·알약)는 그대로 먹는다 —
          // Pan은 손가락이 얼마쯤 움직여야 시작되므로 톡 누르는 것과 안 부딪힌다.
          <GestureDetector gesture={pan}>{재는상자}</GestureDetector>
        ) : (
          재는상자
        )}
      </Animated.View>
    </Pressable>
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* ⚠️ 안드로이드에서는 Modal 안이 별도의 창이라, 앱 바깥(app/_layout.tsx)에 씌운
          GestureHandlerRootView가 여기까지 닿지 않는다. 다시 감싸지 않으면 **오류 없이
          조용히 안 끌린다.** 공식 설치 문서가 시키는 대로다.
          끌지 않는 다섯 시트에는 씌우지 않는다 — 안 쓰는 곳의 터치 흐름까지 건드릴
          이유가 없다. */}
      <SheetScrollContext.Provider value={시트속}>
        {dragToClose ? (
          <GestureHandlerRootView style={styles.gestureRoot}>{껍데기}</GestureHandlerRootView>
        ) : (
          껍데기
        )}
      </SheetScrollContext.Provider>
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
