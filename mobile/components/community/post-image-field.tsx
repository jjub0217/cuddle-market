import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Camera, RotateCcw, X } from 'lucide-react-native';

import { messageStyles } from '@/components/signup/field';
import { FieldLabel } from '@/components/ui/field-label';
import { colors } from '@/constants/colors';

import {
  MAX_IMAGES,
  pickImages,
  shrinkImage,
  uploadOne,
  type UploadSlot,
} from '@/lib/product-images';

// 커뮤니티 글쓰기의 사진 칸. 상품 등록(products/image-field.tsx)과 **같은 격자**다 —
// 앱 안에서 사진 고르는 화면이 두 모양이면 안 된다. 격자·썸네일 크기·올리는 중 표시·
// 다시 올리기·빼기 단추는 거기서 그대로 옮겨 왔다.
//
// ⚠️ 다른 점 하나: **대표 지정이 없다.** 커뮤니티 글에는 대표 개념이 없고, 본문에 넣는
//    차례가 곧 순서다. 목록 썸네일은 서버가 본문 첫 ![](주소) 에서 뽑는다.
//    그래서 makeMain·「대표」 뱃지·「눌러서 대표를 바꿀 수 있어요」 안내를 뺐고,
//    사진을 누르는 일 자체가 없어 **실패한 칸에만** 누를 자리를 둔다.
//
// ⚠️ 상품 등록 것을 공용으로 갈라내지 않았다. 거기는 대표 지정이 얽혀 있어 갈라내면
//    상품 등록까지 다시 확인해야 한다. 세 번째 쓰는 곳이 생기면 그때 갈라낸다.
//
// 값을 스스로 들고 있지 않다. 화면이 slots를 들고, 이 칸은 바뀔 때마다 onChange로 알린다 —
// 남은 글자 수를 세려면 화면이 올라간 주소를 알아야 하기 때문이다.

/** 사진 한 칸의 한 변. products/image-field.tsx 와 같은 값이다 */
const THUMB_SIZE = 96;

/** 상품 등록 안내에서 **대표 이야기만 뺀** 나머지다. 문구를 새로 짓지 않았다 */
const DESCRIPTION = '최대 5장 (각 5MB 이하)';

interface PostImageFieldProps {
  slots: UploadSlot[];
  /** ⚠️ 이 조각은 자기 상태를 안 든다. 화면이 slots 를 들고 있어야 남은 글자 수를 셀 수 있다 */
  onChange: (slots: UploadSlot[]) => void;
}

export function PostImageField({ slots, onChange }: PostImageFieldProps) {
  // 올리는 동안에는 빼기를 막는다. 올리는 반복문은 자기 목록(current)을 들고 이어가는데,
  // 그 사이에 사용자가 목록을 바꾸면 다음 한 장이 끝나는 순간 그 변경이 덮여 되살아난다 —
  // 「지웠는데 다시 나타난다」로 보인다.
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

  /** 실패한 그 한 칸만 다시 올린다. 사진첩을 다시 열지 않는다 */
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

  return (
    <View style={styles.field}>
      {/* 다른 칸 이름표와 같은 조각을 쓴다. 사진은 필수가 아니라 별표를 안 붙인다 */}
      <FieldLabel text={`사진 (${slots.length}/${MAX_IMAGES})`} />
      <Text style={messageStyles.hint}>{DESCRIPTION}</Text>

      <View style={styles.row}>
        {slots.map((slot, index) => {
          const uploading = !slot.failed && slot.url === null;

          return (
            <View key={slot.key} testID={`post-image-${index}`} style={styles.thumb}>
              <View style={styles.thumbBox}>
                <Image source={{ uri: slot.localUri }} style={styles.image} contentFit="cover" />

                {uploading ? (
                  <View style={styles.overlay}>
                    <ActivityIndicator color={colors.onAction} />
                  </View>
                ) : null}

                {/* 실패한 칸에만 누를 자리가 생긴다. 상품 등록은 여기에 「대표로」가 겹쳐 있다 */}
                {slot.failed ? (
                  <Pressable
                    onPress={() => void handleRetry(slot)}
                    accessibilityRole="button"
                    accessibilityLabel="다시 올리기"
                    style={styles.overlay}
                  >
                    <RotateCcw size={20} color={colors.onAction} />
                    <Text style={styles.overlayLabel}>다시</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => handleRemove(slot.key)}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="사진 빼기"
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <X size={14} color={colors.onAction} strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}

        {/* 다 차면 사라진다. 더 고를 수 없는데 단추만 남아 있으면 눌러 보고 나서야 안다. */}
        {slots.length < MAX_IMAGES ? (
          <Pressable
            testID="post-image-add"
            onPress={() => void handlePick()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="이미지 등록"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Camera size={24} color={colors.onSurfaceMuted} strokeWidth={1.5} />
            <Text style={styles.addLabel}>이미지 등록</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ⚠️ 값은 products/image-field.tsx 것을 그대로 옮겼다. 두 화면이 달라 보이면 안 된다.
//    거기 있던 mainBadge·mainBadgeText(대표 뱃지)만 뺐다.
const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  // 상품 등록에서는 이 자리가 Pressable(대표 지정)이었다. 여기는 누를 일이 없어 View 다
  thumbBox: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.outlineVariant, // 사진이 뜨기 전 회색 자리
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
  overlayLabel: { fontSize: 12, fontWeight: '600', color: colors.onAction },

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
    backgroundColor: colors.onSurfaceMuted,
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
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  addLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceMuted },

  pressed: { opacity: 0.6 },
});
