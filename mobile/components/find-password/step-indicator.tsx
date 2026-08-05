import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 1-2-3 진행 표시. 웹의 StepIndicator 와 같은 자리에 같은 뜻으로 둔다.
//
// ⚠️ 넣을지 뺄지는 실기기에서 보고 정하기로 했다(설계 §3). 화면에서 한 줄만 지우면
//    빠지도록 이 조각 하나에 가둬 뒀다 — 색·상태를 바깥으로 흘리지 않는다.
//
// **이름표를 두지 않는다 — 숫자만이다** (2026-08-05 실기기 확인 뒤 결정).
//
// 처음에는 웹처럼 숫자 아래에 「이메일 · 인증 · 새 비밀번호」를 달았는데, **바로 아래
// 본문 제목이 같은 말을 또 했다.** 웹도 같은 겹침을 갖고 있다 — StepIndicator 의 이름표
// (이메일 입력 · 이메일 인증 · 비밀번호 재설정)와 StepHeader 의 제목이 글자까지 같다.
//
// 그래서 역할을 나눴다:
//   여기(숫자)   「셋 중 어디쯤인가」만 말한다
//   본문 제목     「지금 무엇을 하는가」를 말한다 (app/find-password.tsx 의 headline)
//
// 덤으로 폭 문제도 사라진다. 이름표 셋을 가로로 늘어놓느라 좁은 폰(320px)에서 여유가
// 없었고, 글자 크기를 키운 사람에게서는 부딪혔다.

const STEPS = [1, 2, 3] as const;

const DONE = '#111827';
const PENDING = '#D1D5DB'; // 아직 안 지나온 단계

const DOT_SIZE = 22;

/** 화면을 읽어주는 기능에 붙일 말. 눈으로는 숫자만 보이므로 여기서 이름을 알린다. */
const NAMES = ['이메일 입력', '이메일 인증', '새 비밀번호'];

interface Props {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: Props) {
  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const reached = step <= current;
        return (
          <Fragment key={step}>
            {index > 0 ? <View style={[styles.line, reached && styles.lineDone]} /> : null}

            {/* 눈에는 숫자만 보이지만, 읽어주는 기능에는 단계 이름과 지금 위치를 말해 준다.
                가입 화면의 PasswordChecklist 가 ✓/✕ 를 말로 붙이는 것과 같은 방식이다. */}
            <View
              style={[styles.dot, reached && styles.dotDone]}
              accessibilityLabel={`${step}단계 ${NAMES[index]} ${
                step === current ? '지금 단계' : reached ? '지나옴' : '아직'
              }`}
            >
              <Text style={[styles.number, reached && styles.numberDone]}>{step}</Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 이름표가 없어 줄 높이가 동그라미 하나뿐이다. 가운데로 모은다
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  line: {
    // 이름표를 뺀 만큼 선을 넉넉히 둔다. 셋이 한가운데 모여 진행이 한눈에 읽힌다
    width: 40,
    height: 1,
    marginHorizontal: 8,
    backgroundColor: PENDING,
  },
  lineDone: { backgroundColor: DONE },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PENDING,
  },
  dotDone: { backgroundColor: DONE },
  // 아직 안 지나온 동그라미는 옅은 회색(#D1D5DB)이라 흰 숫자를 얹으면 거의 안 보인다.
  // 웹도 같은 자리에 회색 글자를 쓴다(bg-gray-300 에 text-gray-500).
  number: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  numberDone: { color: '#FFFFFF' },
});
