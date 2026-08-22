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
  /**
   * 어떻게 가입했나. `LOCAL`(이메일) · `KAKAO` · `GOOGLE` …
   *
   * ⚠️ **비밀번호를 바꾸는 자리를 그릴지 가른다.** 소셜 계정에는 비밀번호가 없다.
   *    웹도 같은 기준이다(`ProfileUpdate.tsx` 의 `isSocialLogin` — `provider !== 'LOCAL'`).
   */
  provider: string | null;
  /** 소개글 */
  introduction: string | null;
  /**
   * 본인 인증으로 들어온 이름. **못 고친다** — 보여주기만 한다.
   * 서버가 이미 준다(`UserProfileResponse.java:28`).
   */
  name: string | null;
  /** 가입한 이메일. **못 고친다**(`UserProfileResponse.java:30`) */
  email: string | null;
}

/** 서버가 주는 그대로. 안 온 값은 undefined 라 아래에서 null로 채운다 */
interface MyProfileResponse {
  data: Partial<MyProfile> & { id: number; nickname: string };
}

export async function fetchMe(): Promise<MyProfile> {
  const res = await apiFetch('/profile/me');

  if (!res.ok) {
    throw new Error(`내 정보를 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as MyProfileResponse;
  const data = body.data;

  // 안 온 값을 null로 못 박는다. undefined 로 두면 「아직 안 받았다」와 「비어 있다」가
  // 구분이 안 되고, 저장할 때 그대로 실으면 키가 통째로 빠져 서버가 지운다.
  return {
    id: data.id,
    nickname: data.nickname,
    profileImageUrl: data.profileImageUrl ?? null,
    addressSido: data.addressSido ?? null,
    addressGugun: data.addressGugun ?? null,
    birthDate: data.birthDate ?? null,
    provider: data.provider ?? null,
    introduction: data.introduction ?? null,
    name: data.name ?? null,
    email: data.email ?? null,
  };
}

/**
 * 프로필을 저장할 때 보내는 값.
 *
 * ⚠️ **서버는 전체 교체다**(`User.java:225-240` — 받은 값을 조건 없이 그대로 넣는다).
 *    안 보낸 값은 null 로 덮여 **지워진다.** 그래서 이 화면에서 안 고치는 값도
 *    지금 값을 그대로 실어 보내야 한다. 상품 수정(#826)과 같은 규칙이다.
 */
export interface UpdateMeInput {
  nickname: string;
  /** YYYY-MM-DD */
  birthDate: string;
  addressSido: string;
  addressGugun: string;
  /** 없으면 null 을 **명시해서** 보낸다. 키를 빠뜨리면 서버가 지운다 */
  profileImageUrl: string | null;
  introduction: string | null;
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
