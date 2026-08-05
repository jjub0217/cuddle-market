import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 1-2-3 진행 표시. 웹의 StepIndicator 와 같은 자리에 같은 뜻으로 둔다.
//
// ⚠️ 넣을지 뺄지는 실기기에서 보고 정하기로 했다(설계 §3). 화면에서 한 줄만 지우면
//    빠지도록 이 조각 하나에 가둬 뒀다 — 색·상태를 바깥으로 흘리지 않는다.
//
// 숫자 **아래**에 이름표를 둔다(2026-08-05 실기기 확인 뒤 요청). 웹도 같은 배치다.
// 처음에는 숫자와 이름표를 옆으로 나란히 뒀는데 한 줄이 길어져 좁은 폰에서 여유가 없었다.

// 단계 이름.
//
// ⚠️ 웹과 **일부러 다르다.** 웹은 「이메일 입력 · 이메일 인증 · 비밀번호 재설정」인데
//    앱은 짧게 줄였다. 세로로 쌓아도 이름표 셋이 가로로 나란히 서는 것은 같아서,
//    긴 말을 쓰면 좁은 폰에서 칸끼리 부딪힌다.
//    줄인 말은 앱이 같은 단계의 헤더에 쓰는 제목과 맞췄다 — 한 화면 안에서 두 이름이
//    갈리면 안 된다(app/find-password.tsx 의 headline).
const LABELS = ['이메일', '인증', '새 비밀번호'];

const DONE = '#111827';
const PENDING = '#D1D5DB'; // 아직 안 지나온 단계

const DOT_SIZE = 22;

interface Props {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: Props) {
  return (
    <View style={styles.row}>
      {LABELS.map((label, index) => {
        const step = index + 1;
        const reached = step <= current;
        return (
          <Fragment key={label}>
            {/* 잇는 선. 이름표가 아래로 내려갔으니 선은 동그라미 높이의 한가운데에 맞춘다 */}
            {index > 0 ? <View style={[styles.line, reached && styles.lineDone]} /> : null}

            <View style={styles.item}>
              <View style={[styles.dot, reached && styles.dotDone]}>
                <Text style={[styles.number, reached && styles.numberDone]}>{step}</Text>
              </View>
              {/* 지금 어디인지가 색으로만 드러나서, 화면을 읽어주는 기능에는 말로 붙여준다.
                  가입 화면의 PasswordChecklist 가 ✓/✕ 를 말로 붙이는 것과 같은 방식이다. */}
              <Text
                style={[styles.label, reached && styles.labelDone]}
                accessibilityLabel={`${step}단계 ${label} ${
                  step === current ? '지금 단계' : reached ? '지나옴' : '아직'
                }`}
              >
                {label}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // flex-start 로 세운다. center 로 두면 이름표 길이가 서로 달라 동그라미 줄이 어긋난다
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  item: { alignItems: 'center', gap: 6 },
  line: {
    width: 24,
    height: 1,
    marginHorizontal: 6,
    // 동그라미 한가운데 높이에 맞춘다
    marginTop: DOT_SIZE / 2,
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
  label: { fontSize: 12, color: '#9CA3AF' },
  labelDone: { color: '#111827', fontWeight: '600' },
});
