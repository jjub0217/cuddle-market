# 앱 프로필 수정 설계 (#860)

> 18바퀴. 앱에서 내 정보를 고칠 길을 만든다.

## 1. 무엇이 없나

**앱에서 내 정보를 고칠 길이 없다.** 가입할 때 정한 닉네임·지역이 영영 굳는다 —
오타를 냈어도, 소셜 가입이라 닉네임이 자동으로 정해졌어도 그대로다.

```
앱 마이 화면   계정 카드(사진·닉네임·지역) + 판매/구매/찜/차단 …   전부 읽기
              ⚠️ 계정 카드가 있는데 **누를 수가 없다**
웹            같은 카드에 「프로필 수정」 단추가 붙어 있다 (ProfileData.tsx:380-386)
```

## 2. 서버 — 작업이 0이다

직접 열어 확인했다.

```
GET   /profile/me            UserProfileResponse
                             provider ✅(:22) · introduction ✅(:27)
                             ⚠️ 서버는 주는데 **앱이 안 받고 있었다**(lib/profile.ts:11)

PATCH /profile/me            ProfileUpdateRequest — 여섯 개
                             nickname · birthDate · addressSido · addressGugun
                             · profileImageUrl · introduction

PATCH /auth/password/change  PasswordChangeRequest — 셋
                             currentPassword · newPassword · confirmPassword
                             ⚠️ **프로필 수정과 경로가 다르다**
                             ⚠️ 확인용까지 서버가 받는다 — 앱에서만 맞춰보는 게 아니다
```

### ⚠️ 프로필 수정은 **전체 교체**다

```java
// User.java:225-240
this.nickname = nickname;
this.profileImageUrl = profileImageUrl;   // null 이 오면 null 로 덮어쓴다
this.introduction = introduction;         // 조건 없이 그대로 넣는다
```

**안 보낸 값은 지워진다.** 상품 수정(#826)에서 겪은 것과 같다.

지금 앱은 넷만 보낸다(`social-signup.tsx:147`). 그래도 **아직은 사고가 안 났다** —
소셜 가입 시 사진을 아예 안 채우기 때문이다(`OAuth2UserPersistenceService.java:84-95`
에 `profileImageUrl` 이 없다). 채워질 값이 없으니 지워질 것도 없었다.

⚠️ **이번에 사진·소개글을 넣는 길을 만들면 그때부터 진짜 문제가 된다.**
「추가 정보 입력」을 다시 저장하는 순간 방금 넣은 사진이 지워진다.
→ `updateMe` 를 **여섯 개 다 보내는** 모양으로 바꾼다. 소셜 가입 화면도 같은 함수를 쓰므로
   저절로 고쳐진다.

## 3. 들어가는 길 — 계정 카드 하나

웹도 **하나뿐이다**(`ProfileData.tsx:382`가 유일). 여러 길을 만들 이유가 없다.

```
마이 화면
┌────────────────────────────┐
│ (사진)  협주            〉  │  ← 누르면 프로필 수정으로
│         서울특별시 은평구     │
└────────────────────────────┘
```

**오른쪽 `〉` 를 붙인다.** 웹은 카드 안에 「프로필 수정」 단추를 두지만, 앱에는 이미
「누르면 들어가는 줄」이 여럿 있고 다 오른쪽에 `ChevronRight` 가 있다
(`components/my/section-card.tsx:59` — 크기 22, 색 `#9CA3AF`).
같은 방식이면 **앱 안에서 「누르면 들어간다」가 한 모양**이 된다.

문구가 아니라 **손으로 누르는 방식**이라 폰 관례를 따른다.

## 4. 화면 — 웹처럼 하나

```
프로필 수정
┌────────────────────────────┐
│ 기본 정보                    │
│   (사진)  바꾸기             │
│   닉네임  [            ]     │
│   지역    [시/도 ▾][시/군/구 ▾]│
│   소개글  [            ]     │
│              [저장]          │
├────────────────────────────┤
│ 비밀번호 변경                 │  ← provider 가 LOCAL 일 때만
│   현재    [            ]     │
│   새      [            ]     │
│   새 확인 [            ]     │
│         [비밀번호 변경]        │
└────────────────────────────┘
```

**웹과 같다.** 두 폼이 각자 제목과 저장 단추를 갖고 세로로 쌓인다
(`ProfileUpdate.tsx:118-120`). 제목도 웹에서 가져온다 —
「기본 정보」(`ProfileUpdateBaseForm.tsx:217`) · 「비밀번호 변경」(`ProfileUpdatePasswordForm.tsx:110`).

**왜 안 나누나** — 저장 단추가 둘이라 헷갈릴까 싶었지만, 각자 제목 아래 자기 저장을 두면
「비밀번호를 고쳤으니 비밀번호 쪽 저장을 누른다」가 된다. 웹에서 이미 그렇게 쓰인다.

나누면 드는 비용이 더 크다.
```
마이 화면에 웹에 없는 줄이 하나 는다
화면이 하나 더 는다
LOCAL 판단이 **두 곳**에 생긴다 — 줄을 숨길 때 + 주소로 직접 들어온 것을 막을 때
```
한 화면이면 **폼을 안 그리는 것**으로 끝난다.

## 5. 소셜 계정 — 비밀번호 폼을 안 그린다

웹과 같은 기준을 쓴다.

```js
// ProfileUpdate.tsx:41, :119
const isSocialLogin = !!myData?.provider && myData.provider !== 'LOCAL'
{!isSocialLogin ? <ProfileUpdatePasswordForm /> : null}
```

⚠️ **앱의 `MyProfile` 에 `provider` 를 더해야 한다.** 서버는 이미 주고 있다.

## 6. 사진이 없을 때 — 지금 그대로

웹도 앱도 이미 **닉네임 첫 글자**를 그린다.

```
웹    ProfileAvatar.tsx:42    {nickname.charAt(0).toUpperCase()}
앱    profile-head.tsx:32 · (my)/index.tsx:83    같은 방식
```

소셜 가입자도 빈 동그라미가 아니라 글자가 보인다. **대표 그림으로 바꾸지 않는다** —
그러면 모든 소셜 가입자가 똑같아 보이는데, 글자는 사람마다 달라 구분이 된다.

지금 문제는 「기본 그림이 없다」가 아니라 **「바꿀 길이 없다」**였다.

## 7. 고칠 파일

```
mobile/lib/profile.ts                      MyProfile 에 provider·introduction·profileImageUrl
                                           UpdateMeInput 을 여섯 개로
mobile/app/(tabs)/(my)/index.tsx           계정 카드를 누를 수 있게 (〉 붙이기)
mobile/app/profile-edit.tsx (새로)          프로필 수정 화면
mobile/lib/password.ts (새로)               PATCH /auth/password/change
```

재사용할 조각:
```
components/products/region-field.tsx   지역 고르기 (시/도 → 시/군/구)
components/products/image-field.tsx    사진 고르기
```

⚠️ **둘 다 옮기지 않는다.** `region-field` 는 이미 상품 밖에서 쓰이고 있다 —
소셜 가입(`social-signup.tsx`) · 회원가입(`components/signup/address-field.tsx`) ·
상품 등록. 프로필 수정이 넷째가 될 뿐이라 **이번에 처음 어긋나는 게 아니다.**

옮기려면 네 곳의 import 를 다 고쳐야 하는데, 그건 이 바퀴가 할 일이 아니다.
**따로 이슈로 뺀다** — 「상품 전용이 아닌 조각을 `components/ui/` 로」.
(15바퀴에도 `search-bar-header` 로 같은 상황이 있었고 그때도 미뤘다)

## 8. 함정

```
전체 교체         안 보낸 값은 지워진다. updateMe 를 여섯 개 다 보내게 바꾼다
                 ⚠️ 소셜 가입 화면도 같은 함수를 쓴다 — 거기도 여섯 개를 보내야 한다
provider 없음     앱의 MyProfile 이 안 받고 있다. 더해야 비밀번호 폼을 가를 수 있다
비밀번호 경로     PATCH /auth/password/change — 프로필 수정과 다르다
확인용 비밀번호   서버가 confirmPassword 까지 받는다. 앱에서만 맞춰보고 끝내면 안 된다
사진 없을 때      닉네임 첫 글자가 이미 있다. 대표 그림으로 바꾸지 않는다
```

## 9. 실기기 확인

- [ ] 마이 화면의 계정 카드를 누르면 프로필 수정으로 간다
- [ ] 닉네임·지역·소개글을 고치고 저장하면 반영된다
- [ ] 사진을 바꾸면 반영된다
- [ ] **사진을 넣은 뒤 다른 것만 고쳐 저장해도 사진이 안 지워진다** (전체 교체 함정)
- [ ] 소셜 계정이면 비밀번호 폼이 **안 보인다**
- [ ] 이메일 계정이면 비밀번호를 바꿀 수 있다
- [ ] 현재 비밀번호가 틀리면 알려준다
- [ ] 새 비밀번호와 확인이 다르면 알려준다
