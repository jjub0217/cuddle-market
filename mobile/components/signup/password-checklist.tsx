import { StyleSheet, Text, View } from 'react-native';

import { messageStyles } from './field';

// 비밀번호 조건을 줄마다 따로 보여준다.
//
// 왜 오류 문구 하나가 아닌가: validatePassword는 "첫 번째로 걸린 문제" 하나만
// 알려준다. 길이를 채우면 그제서야 구성이 모자라다는 걸 알게 되어, 사용자가
// 한 번에 하나씩 더듬어 가야 한다. 조건을 모두 펼쳐 두면 무엇이 남았는지 바로 보인다.
//
// 기호는 웹과 같이 이모지가 아닌 글자를 쓴다 — 이모지는 기기마다 모양이 다르다.

interface Props {
  checks: { length: boolean; composition: boolean };
  /** 입력이 시작되기 전에는 보이지 않는다. 치지도 않았는데 빨간 줄부터 뜨면 혼내는 꼴이다. */
  visible: boolean;
}

const RULES: { key: keyof Props['checks']; label: string }[] = [
  { key: 'length', label: '10~30자' },
  { key: 'composition', label: '영문 대소문자·숫자·특수문자 포함' },
];

export function PasswordChecklist({ checks, visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.list}>
      {RULES.map((rule) => {
        const passed = checks[rule.key];
        return (
          <Text
            key={rule.key}
            style={passed ? messageStyles.success : messageStyles.error}
            accessibilityLabel={`${rule.label} ${passed ? '충족' : '미충족'}`}
          >
            {passed ? '✓' : '✕'} {rule.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
});
