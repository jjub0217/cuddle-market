# 앱 프로필 수정 구현 계획 (#860)

> 설계: `docs/superpowers/specs/2026-08-07-app-profile-edit-design.md`
> 브랜치: `feature/860--app-profile-edit`

**만드는 것** — 앱에서 내 정보(사진·닉네임·지역·소개글)를 고치고, 이메일 계정은
비밀번호도 바꾼다. 서버는 이미 다 받으므로 앱만 고친다.

**어떻게** — 마이 화면의 계정 카드를 눌러 들어간다. 화면은 하나이고, 기본 정보 폼과
비밀번호 폼이 각자 저장 단추를 갖고 세로로 쌓인다(웹과 같다).

---

## 못 박아 둘 것

```ts
// mobile/lib/profile.ts — 셋을 더한다
export interface MyProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  addressSido: string | null;
  addressGugun: string | null;
  birthDate: string | null;
  /** 'LOCAL' | 'KAKAO' | 'GOOGLE' … 비밀번호 폼을 그릴지 가른다 */
  provider: string | null;      // ← 새로
  /** 소개글 */
  introduction: string | null;  // ← 새로
}

// ⚠️ 여섯 개를 **다** 받는다. 서버가 전체 교체라 안 보낸 값은 지워진다
export interface UpdateMeInput {
  nickname: string;
  birthDate: string;
  addressSido: string;
  addressGugun: string;
  profileImageUrl: string | null;  // ← 새로
  introduction: string | null;     // ← 새로
}

// mobile/lib/password.ts (새로)
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;   // ⚠️ 서버가 확인용까지 받는다
}
export async function changePassword(input: ChangePasswordInput): Promise<void>
```

⚠️ **`updateMe` 를 여섯 개로 바꾸면 소셜 가입 화면(`social-signup.tsx:147`)이 깨진다.**
그 화면도 여섯 개를 보내게 같이 고쳐야 한다 — 안 고치면 타입 오류가 난다(그래서 놓칠 일은 없다).

---

## Task 1: 내 정보를 더 받아온다

**파일**
- 고침: `mobile/lib/profile.ts` · `mobile/lib/profile.test.ts`
- 고침: `mobile/app/social-signup.tsx` (호출부)

- [x] **1-1.** 시험 먼저

```ts
it('provider 와 introduction 도 꺼낸다', async () => {
  // ⚠️ 서버는 원래 주고 있었는데 앱이 안 받고 있었다(UserProfileResponse:22, :27)
  apiFetch.mockResolvedValue(
    okJson({ data: { id: 1, nickname: '협주', provider: 'KAKAO', introduction: '안녕하세요' } })
  );

  const me = await fetchMe();

  expect(me.provider).toBe('KAKAO');
  expect(me.introduction).toBe('안녕하세요');
});

it('안 오면 null 이다', async () => {
  apiFetch.mockResolvedValue(okJson({ data: { id: 1, nickname: '협주' } }));

  const me = await fetchMe();

  expect(me.provider).toBeNull();
  expect(me.introduction).toBeNull();
});

it('여섯 개를 다 보낸다 — 안 보내면 서버가 지운다', async () => {
  // ⚠️ 서버는 전체 교체다(User.java:225-240). 안 보낸 값은 null 로 덮인다
  apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

  await updateMe({
    nickname: '협주',
    birthDate: '1996-02-17',
    addressSido: '서울특별시',
    addressGugun: '은평구',
    profileImageUrl: 'https://cdn/a.webp',
    introduction: '안녕하세요',
  });

  const sent = JSON.parse((apiFetch.mock.calls[0][1] as { body: string }).body);
  expect(Object.keys(sent).sort()).toEqual(
    [
      'addressGugun',
      'addressSido',
      'birthDate',
      'introduction',
      'nickname',
      'profileImageUrl',
    ].sort()
  );
});
```

- [x] **1-2.** 돌려서 깨지는지 본다

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest lib/profile
```

- [x] **1-3.** `MyProfile` 에 `provider`·`introduction` 을 더하고, `fetchMe` 가 `?? null` 로 채운다
- [x] **1-4.** `UpdateMeInput` 을 여섯 개로 늘린다
- [x] **1-5.** ⚠️ **`social-signup.tsx:147` 도 여섯 개를 보내게 고친다.** 그 화면에는 사진·소개글을
      고르는 자리가 없으므로 **지금 값을 그대로 실어 보낸다**(`me.profileImageUrl` · `me.introduction`).
      그 화면은 이미 `fetchMe()` 로 내 정보를 받아 두고 있다(`social-signup.tsx:78`)
- [x] **1-6.** 시험 초록. 커밋

---

## Task 2: 비밀번호 바꾸는 길

**파일**
- 만듦: `mobile/lib/password.ts` · `mobile/lib/password.test.ts`

- [x] **2-1.** 시험 먼저

```ts
it('PATCH /auth/password/change 로 셋을 보낸다', async () => {
  apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

  await changePassword({
    currentPassword: 'old1234!',
    newPassword: 'new1234!',
    confirmPassword: 'new1234!',
  });

  expect(apiFetch.mock.calls[0][0]).toBe('/auth/password/change');
  const init = apiFetch.mock.calls[0][1] as { method: string; body: string };
  expect(init.method).toBe('PATCH');
  // ⚠️ 확인용까지 서버가 받는다. 앱에서만 맞춰보고 끝내면 안 된다
  expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(
    ['confirmPassword', 'currentPassword', 'newPassword'].sort()
  );
});

it('실패하면 던진다', async () => {
  apiFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) } as Response);

  await expect(
    changePassword({ currentPassword: 'x', newPassword: 'y', confirmPassword: 'y' })
  ).rejects.toThrow();
});
```

- [x] **2-2.** 조각을 만든다. 오류 문구는 **앱의 다른 곳과 같은 결**로
      (`lib/profile.ts` 의 `저장하지 못했어요. 잠시 후 다시 시도해주세요.` 를 본으로)
- [x] **2-3.** 시험 초록. 커밋

---

## Task 3: 프로필 사진 칸 (한 장짜리)

**파일**
- 만듦: `mobile/components/my/profile-image-field.tsx` · `.test.tsx`

⚠️ **`components/products/image-field.tsx` 를 못 쓴다.** 그건 **여러 장**(`UploadSlot[]`)을
다루는 상품용이다 — 대표 사진 정하기, 다섯 장 제한, 실패한 칸만 다시 올리기까지 들어 있다.
프로필은 **한 장**이라 그 구조가 통째로 남아돈다.
**일하는 함수는 그대로 쓴다** — `lib/product-images.ts` 의 `pickImages` · `shrinkImage` · `uploadOne`.

- [x] **3-1.** 시험 먼저. ⚠️ `render`·`fireEvent` 를 **기다린다**(mobile/AGENTS.md)

```tsx
jest.mock('@/lib/product-images', () => ({
  pickImages: jest.fn(),
  shrinkImage: jest.fn(),
  uploadOne: jest.fn(),
}));

it('사진이 없으면 닉네임 첫 글자를 그린다', async () => {
  // 웹·앱이 이미 그렇게 한다(ProfileAvatar.tsx:42). 대표 그림으로 바꾸지 않는다(설계 §6)
  await render(<ProfileImageField url={null} nickname="협주" onChange={jest.fn()} />);

  expect(screen.getByText('협')).toBeTruthy();
});

it('고르면 줄이고 올린 뒤 그 주소로 알린다', async () => {
  const onChange = jest.fn();
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockResolvedValue('file://small.jpg');
  uploadOne.mockResolvedValue('https://cdn/a.webp');

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId('profile-image-pick'));

  await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://cdn/a.webp'));
});

it('고르다 그만두면 아무 일도 없다', async () => {
  const onChange = jest.fn();
  pickImages.mockResolvedValue([]);   // 취소하면 빈 목록이 온다

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId('profile-image-pick'));

  await waitFor(() => expect(pickImages).toHaveBeenCalled());
  expect(onChange).not.toHaveBeenCalled();
});

it('올리는 동안에는 다시 못 누른다', async () => {
  // 두 번 누르면 두 장이 올라가고 나중 것이 이긴다 — 어느 쪽이 남을지 알 수 없다
  const onChange = jest.fn();
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockReturnValue(new Promise(() => {}));   // 끝나지 않게 둔다

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId('profile-image-pick'));
  await fireEvent.press(screen.getByTestId('profile-image-pick'));

  expect(pickImages).toHaveBeenCalledTimes(1);
});
```

- [x] **3-2.** 조각을 만든다

```tsx
interface Props {
  /** 지금 사진. 없으면 null */
  url: string | null;
  /** 사진이 없을 때 그릴 첫 글자를 위한 값 */
  nickname: string;
  /** 올리기가 끝나면 서버 주소로 알린다 */
  onChange: (url: string) => void;
}
```

- 동그란 사진 + 아래에 「사진 바꾸기」. 누르는 자리에 `testID="profile-image-pick"`
- 사진이 없으면 `nickname.charAt(0).toUpperCase()` — 앱의 다른 곳과 같은 모양
- 올리는 동안 표시를 내고 다시 못 누르게 한다

- [x] **3-3.** 시험 초록. 커밋

---

## Task 4: 프로필 수정 화면

**파일**
- 만듦: `mobile/app/profile-edit.tsx`
- 만듦: `mobile/__tests__/profile-edit-screen.test.tsx`

⚠️ **시험을 `app/` 안에 두지 마라.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
앱 번들에 끼워 넣으려다 **실기기가 아예 안 뜬다**(#857에서 겪었다. `mobile/AGENTS.md` 함정 표).

- [x] **4-1.** 화면을 짠다. 웹과 같은 순서·제목

```
┌ 기본 정보 ────────────────┐   ProfileUpdateBaseForm.tsx:217 의 제목
│  (사진)  사진 바꾸기        │
│  닉네임                    │
│  지역     RegionField      │   components/products/region-field.tsx 를 그대로
│  소개글                    │
│         [저장]             │
├ 비밀번호 변경 ─────────────┤   ProfileUpdatePasswordForm.tsx:110 의 제목
│  현재 비밀번호              │   ← provider 가 LOCAL 일 때만 그린다
│  새 비밀번호                │
│  새 비밀번호 확인            │
│      [비밀번호 변경]         │
└──────────────────────────┘
```

- [x] **4-2.** ⚠️ **소셜 계정이면 비밀번호 묶음을 안 그린다.** 웹과 같은 기준이다

```tsx
const isSocial = Boolean(me?.provider) && me.provider !== 'LOCAL';
…
{!isSocial ? <비밀번호묶음 /> : null}
```

- [x] **4-3.** ⚠️ **저장할 때 여섯 개를 다 보낸다.** 화면에 없는 `birthDate` 도 지금 값을 그대로 싣는다

```tsx
await updateMe({
  nickname,
  birthDate: me.birthDate ?? '',   // 이 화면에서는 안 고친다. 안 보내면 지워진다
  addressSido,
  addressGugun,
  profileImageUrl,
  introduction,
});
```

- [x] **4-4.** 저장이 끝나면 내 정보를 다시 받아 화면들에 반영한다
      (`hooks/use-me.ts` 가 react-query 를 쓰므로 그 열쇠를 무르게 한다)
- [x] **4-5.** 시험. `QueryClientProvider` 로 감싼다(`__tests__/community-list-screen.test.tsx` 를 본으로)

덮을 것:
- 지금 값이 칸에 채워져 있다
- 고쳐서 저장하면 **여섯 개를 다** 보낸다
- **소셜 계정이면 비밀번호 묶음이 안 보인다**
- 이메일 계정이면 보인다
- 새 비밀번호와 확인이 다르면 서버를 안 부르고 알려준다

- [x] **4-6.** 커밋

---

## Task 5: 마이 화면에서 들어가는 길

**파일**
- 고침: `mobile/app/(tabs)/(my)/index.tsx`

- [x] **5-1.** 계정 카드를 `Pressable` 로 감싸고 오른쪽에 `ChevronRight` 를 붙인다
      (크기 22 · 색 `#9CA3AF` — `components/my/section-card.tsx:59` 와 같은 값)
- [x] **5-2.** 누르면 `/profile-edit` 로 간다
- [x] **5-3.** ⚠️ **게스트일 때는 안 눌린다.** 그 화면은 로그인해야 볼 수 있고,
      마이 탭은 게스트를 이미 로그인으로 밀어내지만(`(tabs)/_layout.tsx:80-87`)
      카드가 눌리는 것처럼 보이면 안 된다
- [x] **5-4.** `pnpm gate:mobile`(저장소 루트에서). 커밋

---

## Task 6: 실기기 확인

- [x] 마이 화면의 계정 카드를 누르면 프로필 수정으로 간다
- [x] 닉네임·지역·소개글을 고치고 저장하면 반영된다
- [ ] 사진을 바꾸면 반영된다
- [ ] **사진을 넣은 뒤 다른 것만 고쳐 저장해도 사진이 안 지워진다** (전체 교체 함정)
- [ ] **소셜 가입 화면에서 저장해도 사진·소개글이 안 지워진다** (Task 1-5 가 지키는 것)
- [ ] 소셜 계정이면 비밀번호 묶음이 **안 보인다**
- [ ] 이메일 계정이면 비밀번호를 바꿀 수 있다
- [ ] 현재 비밀번호가 틀리면 알려준다
- [ ] 새 비밀번호와 확인이 다르면 알려준다

---

## 함정 (설계 §8 요약)

```
전체 교체          안 보낸 값은 지워진다. 여섯 개를 다 보낸다
                  ⚠️ 소셜 가입 화면도 같은 함수를 쓴다 — 거기도 여섯 개
provider 없음      앱이 안 받고 있었다. 더해야 비밀번호 폼을 가른다
비밀번호 경로      PATCH /auth/password/change — 프로필 수정과 다르다
확인용 비밀번호    서버가 confirmPassword 까지 받는다
ImageField 재사용  못 한다. 여러 장짜리다 — 함수만 가져다 한 장짜리를 새로 만든다
시험 위치         app/ 안에 두면 실기기가 안 뜬다(#857)
사진 없을 때       닉네임 첫 글자가 이미 있다. 대표 그림으로 바꾸지 않는다
```

---

## 계획 밖으로 자란 것 (2026-08-07 실기기·브라우저 검토에서)

앱을 새로 만들자 **웹의 구멍이 드러났다.** 계획에 없던 것을 여기 남긴다.

### 앱

```
닉네임 중복체크        웹·앱 소셜 가입에는 있는데 이 화면만 없었다. 남이 쓰는 닉네임으로
                      저장을 눌러야 서버에서 거절당했다
소개글 글자수          maxLength 200 에서 조용히 안 써졌다. 폰에서는 「키보드 먹통」으로 읽힌다
못 고치는 값 묶음      이름·생년월일·이메일. 앱에는 이걸 볼 곳이 아예 없었다 —
                      내가 어떤 이메일로 가입했는지도 확인할 길이 없었다
카메라 표시            웹에는 있는데 앱에만 없었다. 설계에 뺀 이유가 한 줄도 없다
가입일                 남의 프로필에 없었다 (신뢰 신호인데)
```

### 웹

```
사진이 안 눌렸다        cursor-pointer 는 있는데 onClick 이 없었다.
                      「누를 수 있다」고 해 놓고 안 되는 건 안 눌리는 것보다 나쁘다
안내 문구 여섯 줄       같은 말이 세 번. 하나는 자기소개가 빠져 **틀려 있었다**
이메일이 어디에도 없었다 md:hidden 이라 좁은 화면에만 있고, 데스크탑은 옆 칸에 넣기로
                      해 놓고 옮기다 말았다
가입일이 거꾸로         프로필 수정에만 있고 남의 프로필에는 없었다
```

### 배운 것

```
나열하는 안내는 거짓말이 된다   「A, B, C 를 수정할 수 있습니다」 → 칸이 늘면 조용히 틀린다.
                              이 화면에서만 두 번 겪었다. 가리키는 값 **바로 옆**에 두면
                              나열이 필요 없다
토큰 이름을 믿지 말 것         text-on-surface-muted 는 **갈색**이다(rgba(99,63,0,.85)).
                              회색인 줄 알고 썼다가 문구가 튀었다
날짜 함수가 한쪽에만 있으면     같은 값이 화면마다 다르게 보인다. packages/shared 로 올려
                              웹·앱이 같이 쓴다(formatBirthDate · formatJoinDate)
음수 여백은 gap 과 싸운다      -mt-6 로 gap-8 을 깎으면 개발자도구에서 어떤 값도 안 맞는다.
                              묶음을 하나 만들어 안쪽 간격을 따로 정한다
```

### 서버 — 남의 프로필 응답에 개인정보가 실려 있었다

`GET /api/profile/{userId}` 가 **실명·생년월일·이메일**을 담아 보냈다. 화면에 안 그릴 뿐
응답에는 있어서 개발자도구로 그대로 보였다. 프론트에서 가리는 것으로는 못 막는다.

```
cmarket_api  d42f71d  fix: 남의 프로필 응답에서 실명·생년월일·이메일을 뺀다 (#860)
                      fromDto 에서만 뺐다. fromMyPageDto(내 정보)는 그대로
```

⚠️ **백엔드 저장소에는 이슈를 만들지 않는다.** 할 일은 이 저장소 이슈에 함께 적는다.
(2026-08-07 에 `cmarket_api` 에 이슈를 만들었다가 닫았다 — 삭제 권한이 없다.)
