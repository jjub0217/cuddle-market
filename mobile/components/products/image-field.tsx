import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Camera, RotateCcw, X } from 'lucide-react-native';

import { messageStyles } from '@/components/signup/field';
import { FieldLabel } from '@/components/ui/field-label';

import {
  MAX_IMAGES,
  makeMain,
  pickImages,
  shrinkImage,
  uploadOne,
  type UploadSlot,
} from '@/lib/product-images';

// 사진 고르기 · 미리보기 · 대표 지정 칸.
//
// 웹은 사진을 끌어서 순서를 바꾸지만 앱에는 드래그가 없다. 대신 **누르면 그 사진이 맨 앞(대표)**
// 으로 온다. 그래서 안내 문구도 웹의 「드래그 또는 클릭으로 …업로드」 부분만 바꿔 적었다.
// 나머지 문구는 웹 그대로다.
//
// 값을 스스로 들고 있지 않다. 폼이 slots를 들고, 이 칸은 바뀔 때마다 onChange로 알린다 —
// 등록 화면과 수정 화면이 같은 조각을 나눠 쓰기 때문이다.

/** 사진 한 칸의 한 변. 한 줄에 세 개가 들어가고 손가락으로 누르기에 넉넉하다 */
const THUMB_SIZE = 96;

const DESCRIPTION =
  '첫번째 이미지가 대표 이미지가 됩니다. 눌러서 대표를 바꿀 수 있어요. 최대 5장 (각 5MB 이하)';

interface Props {
  slots: UploadSlot[];
  onChange: (slots: UploadSlot[]) => void;
  error?: string;
}

export function ImageField({ slots, onChange, error }: Props) {
  // 올리는 동안에는 빼기·대표 바꾸기를 막는다.
  // 올리는 반복문은 자기 목록(current)을 들고 이어가는데, 그 사이에 사용자가 목록을 바꾸면
  // 다음 한 장이 끝나는 순간 그 변경이 덮여 되살아난다 — 「지웠는데 다시 나타난다」로 보인다.
  const [busy, setBusy] = useState(false);

  const upload = async (start: UploadSlot[], targets: UploadSlot[]) => {
    let current = start;

    // ⚠️ 한 장씩 보낸다. 나란히 쏘면 요청 다섯 개가 한꺼번에 나가 느린 망에서 더 잘 끊긴다.
    // ⚠️ 반복 도중 slots(바깥 값)를 다시 읽으면 안 된다. 그건 옛 값이라 앞서 올라간 것이 지워진다.
    for (const slot of targets) {
      try {
        const shrunk = await shrinkImage(slot.localUri);
        const url = await uploadOne(shrunk);
        current = current.map((item) => (item.key === slot.key ? { ...item, url } : item));
      } catch {
        current = current.map((item) => (item.key === slot.key ? { ...item, failed: true } : item));
      }
      onChange(current);
    }
  };

  const handlePick = async () => {
    if (busy) return;

    const picked = await pickImages(MAX_IMAGES - slots.length);
    if (picked.length === 0) return;

    // 먼저 빈 칸을 만들어 미리보기부터 띄운다. 다 올라갈 때까지 기다리게 하지 않는다.
    const fresh: UploadSlot[] = picked.map((image, index) => ({
      key: `${Date.now()}-${index}`,
      localUri: image.uri,
      url: null,
      failed: false,
    }));
    const next = [...slots, ...fresh];
    onChange(next);

    setBusy(true);
    try {
      await upload(next, fresh);
    } finally {
      setBusy(false);
    }
  };

  /** 실패한 그 한 칸만 다시 올린다 */
  const handleRetry = async (slot: UploadSlot) => {
    if (busy) return;

    const next = slots.map((item) => (item.key === slot.key ? { ...item, failed: false } : item));
    onChange(next);

    setBusy(true);
    try {
      await upload(next, [slot]);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (key: string) => {
    onChange(slots.filter((slot) => slot.key !== key));
  };

  const handleMakeMain = (key: string) => {
    onChange(makeMain(slots, key));
  };

  return (
    <View style={styles.field}>
      {/* 다른 칸 이름표와 같은 모양이다. 여기만 크고 진하면 한 화면에서 튄다 —
          웹도 같은 이유로 맞춰 뒀다(FormSectionHeader.tsx 주석).
          ⚠️ 사진은 필수가 아니라 별표를 안 붙인다. 웹도 안 붙인다 */}
      <FieldLabel text="상품 사진" />
      <Text style={messageStyles.hint}>{DESCRIPTION}</Text>

      <View style={styles.row}>
        {slots.map((slot, index) => {
          const uploading = !slot.failed && slot.url === null;

          return (
            <View key={slot.key} style={styles.thumb}>
              <Pressable
                // 실패한 칸은 「다시」, 나머지는 「대표로」. 한 칸이 두 가지 일을 하지 않게 갈라 둔다.
                onPress={() =>
                  slot.failed ? void handleRetry(slot) : !busy && handleMakeMain(slot.key)
                }
                disabled={busy && !slot.failed}
                accessibilityRole="button"
                accessibilityLabel={slot.failed ? '다시 올리기' : '대표 이미지로 지정'}
                style={styles.thumbPress}
              >
                <Image source={{ uri: slot.localUri }} style={styles.image} contentFit="cover" />

                {uploading ? (
                  <View style={styles.overlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : null}

                {slot.failed ? (
                  <View style={styles.overlay}>
                    <RotateCcw size={20} color="#FFFFFF" />
                    <Text style={styles.overlayLabel}>다시</Text>
                  </View>
                ) : null}

                {index === 0 ? (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>대표</Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => handleRemove(slot.key)}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="사진 빼기"
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <X size={14} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}

        {/* 다 차면 사라진다. 더 고를 수 없는데 단추만 남아 있으면 눌러 보고 나서야 안다. */}
        {slots.length < MAX_IMAGES ? (
          <Pressable
            onPress={() => void handlePick()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="이미지 등록"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Camera size={24} color="#6B7280" strokeWidth={1.5} />
            <Text style={styles.addLabel}>이미지 등록</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  // 이름표 모양은 ui/field-label.tsx가, 안내 문구는 messageStyles.hint가 들고 있다
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbPress: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB', // 사진이 뜨기 전 회색 자리
  },
  image: { ...StyleSheet.absoluteFillObject },

  // 올리는 중·실패를 사진 위에 겹쳐 보여준다. 칸 밖에 따로 적으면 어느 사진 이야기인지 모른다.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
  },
  overlayLabel: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  // 웹 SortableImageItem과 같은 자리(왼쪽 아래) · 같은 색(--color-primary-container #825500).
  mainBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#825500',
  },
  mainBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  // 웹과 같이 오른쪽 위 회색 동그라미. 사진 위라 흰 ✕가 묻히지 않게 바탕을 깐다.
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },

  addButton: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  addLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  pressed: { opacity: 0.6 },
});
