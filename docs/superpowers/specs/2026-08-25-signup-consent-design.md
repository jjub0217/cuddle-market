# 가입할 때 약관 동의를 받는다 — 설계와 백엔드 명세

> 2026-08-25(화). 가입 화면 넷에 필수 동의 둘을 붙이고, 동의 사실을 서버에 남긴다. 이슈 #1088.
> #803(이용약관 페이지)의 뒤를 잇는다 — 약관은 있는데 아무도 동의한 적이 없으면 반쪽이다.
>
> ⚠️ **이 문서의 백엔드 절은 명세일 뿐 코드가 아니다.** 백엔드는 리드가 붙인다.
> 프론트에서는 백엔드 저장소를 한 줄도 고치지 않았다.

## 1. 무엇을 받나

사람이 정한 것을 그대로 따랐다(2026-08-25 결정). 다시 정하지 않았다.

```
☐ [필수] 이용약관에 동의합니다.          보기 → /terms
☐ [필수] 개인정보처리방침에 동의합니다.   보기 → /privacy
   → 둘 다 켜야 가입 단추가 켜진다
```

마케팅 수신·만 14세 확인은 넣지 않았다. 보낼 것이 없고, 나이는 생년월일을 이미 받는다.

법 근거는 **약관규제법 제3조**다. 제2항이 「계약을 체결할 때」 약관 내용을 분명히 밝히라고 하고,
회원가입이 곧 이용계약 체결이다.

## 2. 자물쇠를 **두 겹**으로 걸었다

이 일감에서 제일 틀리기 쉬운 자리다. **「화면만 회색이고 제출은 되는」 경우**를 막아야 한다.

```
① 단추가 꺼진다        disabled={... || !hasAllConsents}      ← 화면의 일
② 제출이 일어나도
   가입 API 가 안 불린다  onSubmit / submit() 맨 앞의 이름표    ← 진짜 자물쇠
```

②가 따로 필요한 까닭: `disabled` 는 **화면**의 일이다. 웹 폼은 **엔터키로도, 프로그램
호출로도** 제출된다. `onSubmit` 안에서 막지 않으면 그 길로 뚫린다.

실제로 그렇다는 것을 **표식으로 확인했다**(아래 5절). 자물쇠 ②를 빼도 **①번 시험은 그대로
통과**했다 — ①만 있는 시험은 이 회귀를 못 잡는다는 뜻이다.

웹은 자물쇠가 사실상 셋이다. `ConsentFields` 가 체크박스를 `required: true` 로 등록해서
react-hook-form 의 `handleSubmit` 이 **`onSubmit` 자체를 안 부른다.** 그 등록을 누가 지워도
`onSubmit` 맨 앞 이름표가 남아 있으면 가입은 안 일어난다.

## 3. 화면에서 보내는 값

```
termsAgreed: true
privacyAgreed: true
```

⚠️ **동의 시각과 약관 판은 화면에서 만들어 보내지 않는다.** 서버가 스스로 찍는다.

| 왜 | |
|---|---|
| 바꿔치기 | 화면이 보내는 값은 손댈 수 있다. 증명하려고 만든 기록인데 당사자가 값을 정하면 뜻이 없다 |
| 배포 시차 | 웹·앱·서버가 따로 배포된다. 화면이 아는 판과 서버가 가진 판이 어긋날 수 있다 |

## 4. 백엔드 명세 — 리드가 붙일 것

### 4-1. 새 enum

`service/cmarket-domain/.../auth/model/TermsAgreementStatus.java`

```java
public enum TermsAgreementStatus {
    AGREED,     // 가입 화면에서 동의를 받았다
    PRE_TERMS   // 약관 도입 전에 가입해 동의를 받은 적이 없다
}
```

기존 `UserRole` · `AuthProvider` · `WithdrawalReasonType` 와 같은 자리·같은 방식이다
(`@Enumerated(EnumType.STRING)`).

### 4-2. `User` 엔티티에 더할 칸 넷

```java
@Enumerated(EnumType.STRING)
@Column(length = 20)
private TermsAgreementStatus termsAgreementStatus;   // 동의를 받았나 / 도입 전 가입자인가

@Column
private LocalDateTime termsAgreedAt;                 // 언제 동의했나 (도입 전 가입자는 null)

@Column(length = 20)
private String agreedTermsVersion;                   // 어느 판 이용약관에 동의했나  예 "2026-09-01"

@Column(length = 20)
private String agreedPrivacyVersion;                 // 어느 판 방침에 동의했나      예 "2026-07-30"
```

**왜 판(version)이 둘인가**: 두 문서의 시행일이 **이미 다르다.** 방침은 2026-07-30 이고
약관은 2026-09-01 로 잡혀 있다(`terms/page.tsx` 의 `EFFECTIVE_DATE`). 한 칸으로 묶으면
어느 판에 동의한 것인지 적을 수가 없다.

**왜 시각은 하나인가**: 지금은 둘을 **한 번에** 받으므로 늘 같은 시각이다. 나중에 따로 받게
되면 그때 나눈다. 지금 나누면 안 쓰는 칸이 하나 늘 뿐이다.

⚠️ **`@Builder` 가 클래스가 아니라 생성자에 붙어 있다**(`User.java:91`). **필드만 더하면
빌더에 안 들어간다.** 생성자도 같이 고쳐야 한다.

```java
@Builder
public User(
        String email, String password, String name, String nickname,
        LocalDate birthDate, String addressSido, String addressGugun,
        UserRole role, AuthProvider provider, String socialId,
        TermsAgreementStatus termsAgreementStatus,   // ← 넷 다 더한다
        LocalDateTime termsAgreedAt,
        String agreedTermsVersion,
        String agreedPrivacyVersion
) {
    ...
    // ⚠️ 안전한 쪽으로 기울인다 — **모르면 「동의 안 함」이다.**
    //    빠뜨리고 부른 자리가 있어도 「동의함」으로 기록되지 않는다.
    this.termsAgreementStatus =
            termsAgreementStatus != null ? termsAgreementStatus : TermsAgreementStatus.PRE_TERMS;
    this.termsAgreedAt = termsAgreedAt;
    this.agreedTermsVersion = agreedTermsVersion;
    this.agreedPrivacyVersion = agreedPrivacyVersion;
}
```

이 맥에서는 백엔드를 컴파일할 수 없다(JDK 11 / 프로젝트 21). **빠뜨리면 EC2 배포에서야
드러난다** — 2026-08-10 에 실제로 그렇게 배포가 깨졌다.

### 4-3. 판(version) 상수

```java
public final class ConsentVersions {
    public static final String TERMS = "2026-09-01";    // /terms 의 시행일
    public static final String PRIVACY = "2026-07-30";  // /privacy 의 시행일
    private ConsentVersions() {}
}
```

문서를 고쳐 시행일이 바뀌면 이 값도 같이 올린다. 나중에 「이 사람은 옛 판에만 동의했다」를
가려 재동의를 받을 때 이 값이 기준이 된다.

### 4-4. `SignUpRequest` 에 더할 칸 둘

`service/cmarket/.../web/auth/dto/SignUpRequest.java`

```java
@NotNull(message = "이용약관 동의 여부는 필수입니다.")
@AssertTrue(message = "이용약관에 동의해야 가입할 수 있습니다.")
private Boolean termsAgreed;

@NotNull(message = "개인정보처리방침 동의 여부는 필수입니다.")
@AssertTrue(message = "개인정보처리방침에 동의해야 가입할 수 있습니다.")
private Boolean privacyAgreed;
```

⚠️ **`@AssertTrue` 하나로는 모자란다.** Bean Validation 규정상 `@AssertTrue` 는 **null 을
통과시킨다.** 값을 아예 안 보내면 그냥 지나간다 — `@NotNull` 을 같이 붙여야 막힌다.

가입 서비스에서 `User` 를 만들 때:

```java
.termsAgreementStatus(TermsAgreementStatus.AGREED)
.termsAgreedAt(LocalDateTime.now())
.agreedTermsVersion(ConsentVersions.TERMS)
.agreedPrivacyVersion(ConsentVersions.PRIVACY)
```

### 4-5. 소셜 가입 — `ProfileUpdateRequest`

소셜 가입은 별도 가입 API 가 없다. 웹·앱 모두 **`PATCH /profile/me`** 로 모자란 정보를 채운다
(`SocialSignUpForm.tsx` 의 `api.patch('/profile/me', …)`, 앱 `lib/profile.ts` 의 `updateMe`).

```java
// ProfileUpdateRequest 에 더한다 — **선택**이다
private Boolean termsAgreed;
private Boolean privacyAgreed;
```

⚠️ **여기엔 `@AssertTrue`·`@NotNull` 을 붙이면 안 된다.** 이 DTO 는 **프로필 수정**도 쓴다.
필수로 만들면 프로필을 고칠 때마다 동의를 다시 보내야 하는 이상한 일이 된다.
(같은 이유로 앱 `UpdateMeInput` 에서도 두 칸을 선택으로 두었다.)

서버 쪽 규칙:

```
두 값이 다 true 로 오면      → 아직 AGREED 가 아닌 사용자에 한해 AGREED·시각·판을 적는다
값이 안 오면                 → 아무것도 건드리지 않는다 (평범한 프로필 수정)
이미 AGREED 인 사용자        → **덮어쓰지 않는다.** 처음 동의한 시각이 증명에 쓰는 값이다
```

## 5. ⚠️ 기존 가입자 — 이 일감의 핵심

**「가입할 때 동의함」으로 채우면 안 된다.** 동의한 적 없는 사람을 동의했다고 기록하는 것이라,
증명하려고 만든 기록의 값어치를 스스로 없앤다. 분쟁이 생기면 오히려 불리한 증거가 된다.

**NULL 로 두는 것도 답이 아니다.** NULL 은 「동의를 받은 적이 없다」는 **사실**과,
「아직 안 채웠다 · 마이그레이션이 실패했다 · 버그다」를 **구분하지 못한다.** 몇 달 뒤에
그 칸을 보는 사람은 어느 쪽인지 알 길이 없다.

→ **`PRE_TERMS` 라는 값으로 「약관 도입 전 가입자」임을 적어 둔다.** 사실을 값으로 남기는 것이다.

```
termsAgreementStatus = PRE_TERMS
termsAgreedAt        = null        ← 동의한 적이 없으니 시각도 없다. 이건 NULL 이 맞다
agreedTermsVersion   = null
agreedPrivacyVersion = null
```

`termsAgreedAt` 만 NULL 이고 상태 칸은 값이 있다 — **「동의를 안 받았다는 것을 알고 있다」**와
**「모른다」**가 갈린다.

### ⚠️ 컬럼은 자동으로 생기지만 **값은 자동으로 안 찬다**

이슈에 적힌 「`ddl-auto=update` 라 마이그레이션 SQL 이 필요 없다」는 **스키마** 이야기다.
**데이터는 다르다.** 하이버네이트는 컬럼을 만들어 줄 뿐 기존 행을 채워 주지 않는다.
그대로 두면 기존 회원 전부가 NULL 로 남아 위에서 피하려던 상태가 된다.

**배포 순서** (사람이 한다):

```
1. 칸 넷을 **nullable 로** 더해 배포한다
   ⚠️ 처음부터 NOT NULL 로 만들지 마라 — 행이 있는 표에 NOT NULL 컬럼을 붙이면
      MySQL 이 암묵 기본값(빈 글자)을 넣거나 실패한다. 둘 다 나쁘다

2. 한 번만 돌리는 UPDATE 로 기존 행을 채운다
```

```sql
UPDATE users
   SET terms_agreement_status = 'PRE_TERMS'
 WHERE terms_agreement_status IS NULL;
```

```
3. (나중에, 원하면) NOT NULL 로 조인다
```

### 아직 안 정한 것 — 사람이 정할 자리

**기존 가입자에게 재동의를 받을 것인가.** 이 일감은 「구분되게 적어 둔다」까지다.
`PRE_TERMS` 인 사람에게 다음 접속 때 동의를 받는 화면은 **별도 이슈**다.
다만 그 화면을 만들 때 필요한 것(누가 안 받았는지)은 이 설계로 이미 알 수 있다.

## 6. 프론트에서 바꾼 것

| 파일 | 하는 일 |
|---|---|
| `src/features/signup/components/ConsentFields.tsx` | **새로** — 웹 두 화면이 함께 쓰는 동의 체크 둘. 생김새는 `WithdrawModal.tsx` 를 본떴다 |
| `src/features/signup/components/SignUpForm.tsx` | 동의 붙임 · 단추 자물쇠 · `onSubmit` 자물쇠 · 요청에 담음 |
| `src/features/signup/components/SocialSignUpForm.tsx` | 위와 같음 |
| `src/types/auth.ts` | `SignUpRequestData` · `SocialSignUpRequestData` 에 `termsAgreed` · `privacyAgreed` |
| `mobile/components/signup/consent-checkboxes.tsx` | **새로** — 앱에는 체크박스 조각이 없어 만들었다. 「보기」는 `support-links.ts` 의 주소를 연다 |
| `mobile/lib/signup/use-signup-form.ts` | 동의 상태 · `canSubmit` 에 엮음 · `submit()` 자물쇠 |
| `mobile/lib/signup/api.ts` | `SignUpInput` 에 두 칸 |
| `mobile/lib/profile.ts` | `UpdateMeInput` 에 두 칸 — **선택**으로 |
| `mobile/app/signup.tsx` | 동의 붙임 |
| `mobile/app/social-signup.tsx` | 동의 상태 · 단추 자물쇠 · `handleSubmit` 자물쇠 · 요청에 담음 |

동의 조건을 앱 화면이 아니라 **`use-signup-form.ts` 의 `canSubmit` 에** 엮은 까닭:
그 훅이 이미 「가입할 수 있는가」를 혼자 판단하고 있어서, 화면에 조건을 덧붙이면 판단하는
곳이 둘로 갈린다.

## 7. 시험 — 「단추가 회색인가」로 끝내지 않았다

```
lib/signup/use-signup-form.test.ts        앱 일반 가입  (+5)
__tests__/social-signup-consent.test.tsx  앱 소셜 가입  (새 파일, 4)
SignUpForm.test.tsx                       웹 일반 가입  (새 파일, 5)
SocialSignUpForm.test.tsx                 웹 소셜 가입  (새 파일, 5)
```

**넷 다 행복 경로를 끝까지 몬다.** 이메일 인증·닉네임 중복체크·생년월일·거주지까지 다 채워
「동의만 모자란」 상태를 만든 뒤에 잰다. 그래야 「막은 것이 정말 동의인가」를 가릴 수 있다.

⚠️ 이게 없으면 시험이 **거짓 초록**이 된다. 거주지를 안 고른 채로 재면 react-hook-form 이
동의와 상관없이 제출을 막아서, **자물쇠를 통째로 빼도 시험이 통과한다.** 실제로 웹 소셜
가입 시험을 쓰다 이 함정에 한 번 빠졌고, 주소를 고르는 단계를 넣고서야 제대로 잡혔다.

각 파일의 첫 시험이 **「동의까지 하면 서버가 불린다」를 못 박는다.** 그래야 뒤의
「안 불린다」가 동의 때문이라고 말할 수 있다.

### ⚠️ 앱 시험에서 `await` 를 빠뜨리면 안 된다

앱 소셜 가입 시험을 처음 쓸 때 **`render`·`fireEvent` 를 안 기다려서** 「두 번째 시험부터
화면이 아예 안 뜨는」 증상에 한참 걸렸다. 체크박스는 트리에 분명히 있는데 `getByRole` 이
못 찾았다.

`mobile/AGENTS.md:35` 에 그 함정이 적혀 있다 — **안 기다리면 오류 없이 옛 값을 준다.**

```tsx
await render(<Screen />, { wrapper: 감싸기 });
await fireEvent.press(단추);
```

거주지 시트(`BottomSheet`)는 `useSafeAreaInsets` 를 부르므로 `createScreenWrapper({ safeArea: true })`
로 감싸야 「No safe area value available」로 안 죽는다(`mobile/AGENTS.md:46`).

### 표식 검증 — 자물쇠를 빼 보고 시험이 빨개지는지 확인했다

| 어디 | 무엇을 뺐나 | 결과 |
|---|---|---|
| 앱 일반 가입 | `submit()` 의 동의 자물쇠 | **API 미호출 시험 2건만 빨개짐.** `canSubmit`(단추) 시험 3건은 **전부 초록** |
| 웹 일반 가입 | `required` 등록 + `onSubmit` 자물쇠 | API 미호출 2건 빨개짐. `disabled` 시험은 **그대로 통과** |
| 웹 소셜 가입 | 위와 같음 | 같음 |
| 앱 소셜 가입 | 단추 자물쇠 + `handleSubmit` 자물쇠 | 3건 빨개짐 |

**「화면만 회색이고 제출은 되는」 회귀가 `disabled` 시험에는 안 잡힌다**는 것이 눈으로 확인됐다.
자물쇠를 자리를 나눠 두 겹으로 건 까닭이 이것이다.

### ⚠️ 다만 앱 소셜 가입에서는 ②만 빼면 못 잡는다 — 알고 두는 것이다

`handleSubmit` 자물쇠**만** 빼고 단추 자물쇠를 남기면 **네 시험이 다 통과한다.**

까닭: RN 에는 웹의 엔터키·`form.requestSubmit()` 같은 **우회로가 없다.** 화면에서 저장으로
가는 길이 그 단추 하나뿐이라, 단추가 꺼져 있으면 자물쇠②까지 도달할 수가 없다.

```
웹        form.requestSubmit() 로 단추를 건너뛸 수 있다  → ② 시험이 ②를 직접 잡는다
앱 일반   submit() 을 훅 시험에서 직접 부른다            → ② 시험이 ②를 직접 잡는다
앱 소셜   화면에서 갈 길이 단추뿐이다                     → ② 는 시험이 못 닿는다
```

그래도 자물쇠②를 남겨 둔다. 나중에 누가 단추 조건을 손대거나 다른 곳에서 `handleSubmit` 을
부르게 되면 그때 값을 한다 — **덧문**이다. 시험이 못 닿는다는 것을 여기 적어 두는 이유는,
「시험이 초록이니 ②도 지켜진다」고 잘못 읽지 않게 하기 위해서다.
