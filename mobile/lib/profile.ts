import { apiFetch } from '@/lib/auth/api';

// 내 프로필. 저장하지 않고 앱을 켤 때마다 새로 받는다.
// 저장하면 닉네임 · 사진을 바꿔도 앱에 옛날 값이 남고, SecureStore 용량도 먹는다.

/**
 * 서버는 이보다 많은 필드를 주지만 앱이 쓰는 것만 적는다.
 * 웹 `src/types/user.ts`의 User를 통째로 @cuddle/shared에 올리지 않는 이유:
 * 앱이 실제로 쓰는 건 4개뿐이라, 지금 올리면 공유 표면만 넓어지고 드리프트 위험이 는다.
 */
export interface MyProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  addressSido: string | null;
  addressGugun: string | null;
  /** 소셜로 처음 들어오면 null이다. needsSocialSignup이 이 값을 본다 */
  birthDate: string | null;
}

interface MyProfileResponse {
  data: MyProfile;
}

export async function fetchMe(): Promise<MyProfile> {
  const res = await apiFetch('/profile/me');

  if (!res.ok) {
    throw new Error(`내 정보를 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as MyProfileResponse;
  return body.data;
}

/** 「추가 정보 입력」에서 보내는 값. 웹 SocialSignUpForm과 같은 네 개다 */
export interface UpdateMeInput {
  nickname: string;
  /** YYYY-MM-DD */
  birthDate: string;
  addressSido: string;
  addressGugun: string;
}

export async function updateMe(input: UpdateMeInput): Promise<void> {
  const res = await apiFetch('/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  }
}
