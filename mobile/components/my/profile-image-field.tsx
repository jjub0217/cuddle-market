import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { pickImages, shrinkImage, uploadOne } from '@/lib/product-images';

// 프로필 사진 한 장을 고르고 올린다.
//
// ⚠️ **`components/products/image-field.tsx` 를 못 쓴다.** 그건 **여러 장**(`UploadSlot[]`)을
//    다루는 상품용이다 — 대표 사진 정하기, 다섯 장 제한, 실패한 칸만 다시 올리기까지 들어 있다.
//    프로필은 한 장이라 그 구조가 통째로 남아돈다.
//    대신 **일하는 함수는 그대로 쓴다**(`lib/product-images.ts`).
//
// 사진이 없으면 **닉네임 첫 글자**를 그린다. 웹·앱이 이미 그렇게 한다
// (`ProfileAvatar.tsx:42` · `user-profile/profile-head.tsx:32`).

interface Props {
  /** 지금 사진. 없으면 null */
  url: string | null;
  /** 사진이 없을 때 그릴 첫 글자를 위한 값 */
  nickname: string;
  /** 올리기가 끝나면 **서버 주소**로 알린다. 실패하면 안 부른다 */
  onChange: (url: string) => void;
}

export function ProfileImageField({ url, nickname, onChange }: Props) {
  // 올리는 동안 다시 못 누르게 한다. 두 번 누르면 두 장이 올라가고 나중 것이 이기는데,
  // 어느 쪽이 남을지 알 수 없다.
  //
  // ⚠️ **잠금은 ref 로 둔다.** 상태(useState)로 두면 바뀐 값이 **다음 렌더에야** 반영돼서,
  //    연달아 누르면 두 번째가 아직 false 인 값을 보고 들어온다(실제로 두 번 불렸다).
  //    화면에 표시할 「올리는 중」은 상태가 맡고, **막는 일은 ref 가 맡는다.**
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const 보여줄사진 = url && !failed ? url : null;
  const 첫글자 = nickname.charAt(0).toUpperCase();

  const pick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      // 한 장만 고르게 한다
      const picked = await pickImages(1);
      // 고르다 그만두면 빈 목록이 온다
      if (picked.length === 0) return;

      // ⚠️ 줄이기를 건너뛰면 안 된다. 폰 사진은 3~8MB라 서버가 거절한다(한 장 5MB 제한).
      //    아이폰 HEIC 가 webp 로 바뀌는 덤도 여기서 생긴다.
      const small = await shrinkImage(picked[0].uri);
      const uploaded = await uploadOne(small);

      setFailed(false);
      onChange(uploaded);
    } catch {
      // 실패하면 밖으로 안 알린다 — 저장할 때 없는 주소가 실리면 안 된다.
      // 화면에 따로 알리지 않는 이유: 다시 누르면 되고, 그 자리가 곧 안내다.
    } finally {
      // ⚠️ 실패해도 반드시 푼다. 잠긴 채로 두면 사진을 영영 못 바꾼다
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        testID="profile-image-pick"
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel="프로필 사진 바꾸기"
        accessibilityState={{ disabled: busy }}
        style={({ pressed }) => [styles.avatar, pressed && !busy && styles.pressed]}
      >
        {보여줄사진 ? (
          <Image
            source={{ uri: 보여줄사진 }}
            style={styles.avatarImage}
            contentFit="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.initial}>{첫글자}</Text>
        )}

        {busy ? (
          // 올리는 동안 사진 위에 덮는다. 자리를 따로 차지하지 않아 화면이 안 흔들린다
          <View style={styles.busyCover}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>

      <Text style={styles.hint}>사진 바꾸기</Text>
    </View>
  );
}

const AVATAR = 88;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    // 웹 bg-primary-50(#faf3e6)와 같은 연한 베이지. 앱의 다른 동그라미도 이 색이다
    backgroundColor: '#FAF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#825500',
  },
  busyCover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  hint: {
    fontSize: 13,
    color: '#825500',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
