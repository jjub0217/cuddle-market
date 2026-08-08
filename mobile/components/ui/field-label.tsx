import { StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

// 폼 칸 위에 붙는 이름표. 입력칸·고르는 칸·사진 칸이 **모두 이것 하나**를 쓴다.
//
// 왜 조각으로 뺐나: 11바퀴 실기기 확인에서 두 가지가 드러났다.
//   ① 「상품 사진」만 글자가 크고 진했다 — 새로 만든 칸이라 그 자리에서 값을 정했기 때문이다.
//      웹은 같은 증상을 이미 고쳤다(FormSectionHeader.tsx 주석 참고).
//   ② 앱에만 필수 별표가 없었다 — 웹은 RequiredLabel이 붙여 준다.
// 값을 여러 파일에 흩어 두면 또 갈라진다. 그리는 자리를 하나로 모은다.
//
// 웹의 짝: src/components/commons/RequiredLabel.tsx
// ⚠️ 다만 기본값이 반대다. 웹은 required가 기본 true지만 여기는 **기본 false**다 —
//    이 조각은 가입 화면도 같이 쓰는데, 가입 이름표에 별표를 붙이는 건 이번 범위가 아니다.

interface Props {
  /** 「상품명」 같은 칸 이름 */
  text: string;
  /** 필수 칸이면 빨간 별표를 붙인다. 사진은 필수가 아니라 안 붙인다 */
  required?: boolean;
}

export function FieldLabel({ text, required = false }: Props) {
  return (
    <Text style={labelStyles.label}>
      {text}
      {required ? <Text style={labelStyles.required}>*</Text> : null}
    </Text>
  );
}

export const labelStyles = StyleSheet.create({
  // 웹 RequiredLabel과 같은 결이다 — text-gray-900(#111827) · text-sm(14px) · font-semibold.
  //
  // 예전 값은 13px·#6B7280(회색)이었다. 앱 로그인 화면에서 물려받은 값인데
  // (login-form.tsx → signup/field.tsx → 상품 폼), 칸이 둘뿐인 로그인에서 잘 맞던 값이
  // 이름표 여덟 줄짜리 상품 폼에서는 뼈대가 안 잡혔다. 읽기 대비는 둘 다 통과하지만
  // (회색 4.83:1 · 지금 17.74:1) 훑을 때 이름표가 뒤로 물러나 보였다.
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  // 웹 토큰 --color-danger-500(#c91d1d)과 같은 값. 오류 문구에 쓰는 빨강과도 같다
  required: { color: colors.danger },
});
