import { Plus, Send } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';

// 채팅방 아래 입력칸. 소켓이 안 붙어 있으면 보내기를 막는다 —
// 웹도 같은 판단이다(안 붙었으면 보내지 않고 알린다).
//
// 왼쪽 ＋ 는 사진 보내기다(#900). 웹도 입력칸 왼쪽에 같은 자리로 둔다.

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** 소켓이 안 붙어 있거나, 내가 상대를 차단한 방이면 true(#877) */
  disabled: boolean;
  /** ＋ 를 눌렀을 때. 안 주면 ＋ 를 안 그린다 */
  onPickImage?: () => void;
  /** 사진을 올리는 중. 그동안 ＋ 자리에 맴돌이를 그리고 두 번 눌리는 것을 막는다 */
  uploading?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  onPickImage,
  uploading = false,
}: Props) {
  const isOff = disabled || value.trim().length === 0;

  return (
    <View style={styles.wrap}>
      {onPickImage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 보내기"
          disabled={disabled || uploading}
          onPress={onPickImage}
          style={({ pressed }) => [
            styles.plus,
            (disabled || uploading) && styles.plusOff,
            pressed && styles.pressed,
          ]}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.onSurfaceMuted} />
          ) : (
            <Plus size={20} color={colors.onSurfaceMuted} />
          )}
        </Pressable>
      ) : null}
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
  // ＋ 는 보내기 단추와 같은 크기다. 좌우가 같은 무게로 보이게.
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  plusOff: { opacity: 0.4 },
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
