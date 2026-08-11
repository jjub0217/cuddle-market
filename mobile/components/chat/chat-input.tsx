import { Send } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';

// 채팅방 아래 입력칸. 소켓이 안 붙어 있으면 보내기를 막는다 —
// 웹도 같은 판단이다(안 붙었으면 보내지 않고 알린다).

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** 소켓이 안 붙어 있거나, 내가 상대를 차단한 방이면 true(#877) */
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  const isOff = disabled || value.trim().length === 0;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="메시지를 입력하세요"
        placeholderTextColor={colors.onSurfaceSubtle}
        multiline
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="전송"
        disabled={isOff}
        onPress={onSubmit}
        style={({ pressed }) => [styles.send, isOff && styles.sendOff, pressed && styles.pressed]}>
        <Send size={16} color={colors.onAction} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSunken,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSunken,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  sendOff: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
});
