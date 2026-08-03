import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { apiFetch } from './auth/api';

// 사진 고르기 → 줄이기 → **한 장씩** 올리기.
//
// 왜 한 장씩인가: 용량 때문이 아니라 **폰은 전파가 자주 끊기기 때문**이다.
// 한꺼번에 보내면 지하철에서 한 번 끊길 때 다섯 장을 다시 골라야 한다.
// 한 장씩이면 끊긴 그 한 장만 다시 누르면 되고, 올라간 것부터 미리보기가 뜬다.
//
// ⚠️ 고르기는 여러 장이다. 사용자는 사진첩에서 여러 장을 한 번에 고른다 —
//    한 장씩인 것은 **보내는 방식**뿐이라 사용자 눈에는 안 보인다.

/** 서버가 받는 최대 장수. ImageUploadService.MAX_FILE_COUNT와 같은 값 */
export const MAX_IMAGES = 5;

/** 줄이는 크기. 웹 browser-image-compression과 같은 값(maxWidthOrHeight: 800) */
const TARGET_WIDTH = 800;

export interface PickedImage {
  uri: string;
}

/** 화면에 그릴 사진 한 칸. 올라가기 전에도 미리보기를 띄우려고 지역 주소를 함께 들고 있다 */
export interface UploadSlot {
  /** 목록에서 이 칸을 가려내는 값. 지역 주소는 겹칠 수 있어 따로 둔다 */
  key: string;
  /** 폰 안의 주소. 올라가기 전 미리보기에 쓴다 */
  localUri: string;
  /** 서버 주소. 아직 안 올라갔으면 null */
  url: string | null;
  /** 올리다 실패했나. 그 자리에만 「다시」를 그린다 */
  failed: boolean;
}

/**
 * 사진첩을 연다.
 * @param remaining 앞으로 더 고를 수 있는 장수 (이미 있는 것을 뺀 값)
 *
 * ⚠️ `mediaTypes`에 옛 `MediaTypeOptions.Images`를 넣지 마라. SDK 54에서 **더 안 쓰는 값**으로
 *    표시돼 있다. 지금 쓰는 값은 문자열 배열 `['images']`다.
 */
export async function pickImages(remaining: number): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 1, // 줄이는 건 아래 shrinkImage가 한다. 여기서 두 번 줄이면 더 뭉개진다
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri }));
}

/**
 * 사진을 줄인다. 가로 800px · webp.
 *
 * ⚠️ 이걸 안 하면 폰 사진이 3~8MB라 서버가 거절한다(한 장 5MB 제한).
 *    webp로 바꾸는 덤: 아이폰 기본 형식인 HEIC는 서버 허용 목록에 없는데 여기서 풀린다.
 *
 * ⚠️ 옛 `manipulateAsync`는 SDK 54에서 **더 안 쓰는 함수**다. 지금 길은 `manipulate()`로 판을 열고,
 *    바꿀 것을 이어 붙인 뒤 `renderAsync()`로 그려서 `saveAsync()`로 파일을 만드는 것이다.
 *    `release()`는 판과 그림이 붙잡고 있던 native 메모리를 바로 놓아준다 — 사진 다섯 장이면 차이가 난다.
 */
export async function shrinkImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri).resize({ width: TARGET_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.WEBP });

  context.release();
  image.release();

  return result.uri;
}

/**
 * 사진 한 장을 서버에 올리고 주소를 돌려준다.
 *
 * ⚠️ 필드 이름은 `files`다(ImageController의 @RequestParam("files")).
 * ⚠️ apiFetch가 FormData를 알아보고 Content-Type을 안 붙인다(Task 3).
 *    직접 붙이면 경계 문자열이 빠져 서버가 본문을 못 가른다.
 * ⚠️ 서버는 **파일 이름이 아니라 `type`을 보고** 형식을 가린다(ImageUploadService의
 *    ALLOWED_IMAGE_TYPES에 `image/webp`가 있다). 그러니 `type`을 빠뜨리면 안 된다.
 */
export async function uploadOne(uri: string): Promise<string> {
  const form = new FormData();
  form.append('files', {
    uri,
    name: `photo-${uri.split('/').pop() ?? 'image'}.webp`,
    type: 'image/webp',
  } as unknown as Blob);

  const res = await apiFetch('/images', { method: 'POST', body: form });
  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다. 다시 시도해주세요.');

  const body = (await res.json()) as { data?: { mainImageUrl?: string } };
  const url = body.data?.mainImageUrl;
  // 한 장만 보냈으므로 mainImageUrl에 그 한 장이 온다(subImageUrls는 null이다)
  if (!url) throw new Error('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
  return url;
}

/** 누른 사진을 맨 앞으로. 맨 앞이 곧 mainImageUrl이다 */
export function makeMain(slots: UploadSlot[], key: string): UploadSlot[] {
  const target = slots.find((slot) => slot.key === key);
  if (!target) return slots;
  return [target, ...slots.filter((slot) => slot.key !== key)];
}

/**
 * 서버에 보낼 모양으로 바꾼다.
 *
 * ⚠️ 아직 안 올라갔거나 실패한 칸은 뺀다. 그 주소는 폰 안의 것이라 서버가 못 읽는다.
 */
export function toImageUrls(slots: UploadSlot[]): {
  mainImageUrl: string | null;
  subImageUrls: string[];
} {
  const urls = slots.map((slot) => slot.url).filter((url): url is string => Boolean(url));
  return { mainImageUrl: urls[0] ?? null, subImageUrls: urls.slice(1) };
}
