# 계정 열거 막기 · 「계정 찾기」 설계 (#849)

- 날짜: 2026-08-25 (화)
- 이슈: #849 「feat(web·app): 계정 열거를 막고 「계정 찾기」를 만든다 (출시 후)」
- 앞선 판단: #838 에서 「지금은 친절을 택한다」로 미뤘다

---

## 0. 한 줄 결론 — **순서를 뒤집는다**

이슈 본문은 ①문구 뭉개기 → ③계정 찾기 순으로 적혀 있는데, **③ 이 먼저**다
(2026-08-25 사람 결정).

```
지금        비밀번호 찾기가 「계정 찾기」 노릇을 겸한다 — 화면이 새기 때문에
            → 화면만 뭉개면 구멍은 남고 친절만 잃는다

계정 찾기를 먼저 만들면
            「가입 방법을 잊은 사람」이 메일로 답을 받는 정식 경로가 생긴다
            → 그러면 화면을 뭉개도 잃을 친절이 없다 = 딜레마가 사라진다
```

그래서 **1단계 = 계정 찾기**(이번에 만들었다), **2단계 = 문구 뭉개기·응답 시간
맞추기**(설계만 적어 둔다, §8). 1단계도 **서버 엔드포인트가 붙어야 실제로 굴러간다** — §5-5.

⚠️ 「바꿀 신호」(소셜 문의·처방침 점검)를 기다릴 일이 아니라고 본 근거: 그 신호는
**「문구를 뭉갤 때가 됐나」**를 재는 것이지 **「친절을 더할 때가 됐나」**가 아니다.
계정 찾기는 지금 실제로 막히는 사람을 푸는 일이다.

---

## 1. 계정 열거가 무엇인가

남의 이메일을 넣어 봤을 때 화면이 **답을 갈라서** 해 주면, 그 이메일이 이 서비스의
회원인지 밖에서 알 수 있다.

```
비밀번호 찾기에 남의 이메일을 넣는다
  → 「카카오로 가입한 계정이에요」   = 회원이다. 게다가 카카오를 쓴다
  → 「가입된 계정을 찾지 못했어요」   = 회원이 아니다
  → 인증코드 칸으로 넘어간다        = 회원이고, 이메일·비밀번호로 가입했다
```

세 번째 줄이 중요하다. **문구를 다 지워도 「다음 단계로 갔는가」만으로 갈린다.**
「이 이메일은 카카오를 쓴다」는 피싱에 그대로 쓰인다 — 「카카오 계정 확인이
필요합니다」 같은 메일이 훨씬 잘 먹힌다.

---

## 2. 새는 자리 (직접 읽고 확인한 것)

### 2-1. 비밀번호 찾기 — 여기가 제일 크게 샌다

**서버가 갈라서 답한다.** 이것이 뿌리다.

| 넣은 이메일 | 서버 응답 | 근거 |
| --- | --- | --- |
| 가입 안 한 이메일 | `400` · 「등록되지 않은 이메일입니다.」 | `AuthServiceImpl.java:189-190` |
| 카카오·구글로 가입 | `400` · 「카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.」 | `AuthServiceImpl.java:197-200` |
| 이메일로 가입 | `200` · 「인증코드를 발송했습니다.」 | `AuthController.java:384-400` |

> 경로: `~/Desktop/cmarket_api/service/cmarket-domain/.../auth/app/service/AuthServiceImpl.java`
> · `~/Desktop/cmarket_api/service/cmarket/.../web/auth/controller/AuthController.java`

**화면은 그 답을 그대로 보여준다.**

| 자리 | 하는 일 |
| --- | --- |
| `src/features/find-password/components/FindPasswordForm.tsx:35-46` | `blockedText()` 가 「가입된 계정을 찾지 못했어요」 / 「카카오로 가입한 계정이에요」로 갈라 쓴다 |
| 같은 파일 `:127-140` | 서버 문구에 「카카오」·「구글」·「소셜」이 들었는지 훑어 종류를 가린다 |
| 같은 파일 `:449-457` | 단추가 가는 곳까지 갈린다 — 없는 계정은 **회원가입**, 소셜은 **로그인** |
| 같은 파일 `:166` | 성공해야 2단계로 간다 → **단계가 넘어간 것 자체가 「이메일 가입 회원」이라는 신호다** |
| `mobile/app/find-password.tsx:43-52` | 앱도 같은 문구 (일부러 웹과 맞춰 놓았다) |
| `mobile/lib/find-password/api.ts:57-62` | `classify()` 가 서버 문구로 종류를 가린다 |
| `mobile/lib/find-password/use-find-password.ts:115-119` | 그 종류를 `blocked` 상태에 담는다 |

⚠️ **화면 문구를 지워도 안 막힌다.** 위 표의 첫 칸(서버)이 그대로면
`curl` 한 줄로 같은 것을 알아낸다.

### 2-2. 회원가입 — 대놓고 물어보는 API 가 있다

```
GET /api/auth/email/check?email=남의주소@example.com
  → 200 { data: false, message: "이미 사용 중인 이메일입니다." }
```

- 서버: `AuthController.java:90-102` · `AuthServiceImpl.java:303-306`
- 웹이 부르는 자리: `src/features/signup/components/EmailValidCode.tsx:135-141`
- 앱이 부르는 자리: `mobile/lib/signup/api.ts:42-48`
- 가입 제출에서도 한 번 더 샌다: `src/features/signup/components/SignUpForm.tsx:127` (`409`)

**토큰도, 인증도, 횟수 제한도 없다.** 이메일 목록만 있으면 회원인지 아닌지 전부
훑을 수 있다. 열거 위험만 놓고 보면 **이 API 가 가장 크다.**

### 2-3. 응답 시간 — 문구를 다 지워도 시간이 말한다

메일 발송이 **요청 스레드에서 그대로 일어난다**(`EmailServiceImpl.java:39-51`,
`mailSender.send(message)`). **그 메서드에 `@Async` 가 안 붙어 있다** — 비동기 설정
자체는 켜져 있으니(`AsyncConfig`, §5-5) 「기능이 없다」가 아니라 「안 쓰고 있다」다.

```
가입 안 한 이메일   조회 한 번 하고 곧바로 400    → 빠르다
카카오로 가입       조회 한 번 하고 곧바로 400    → 빠르다
이메일로 가입       코드 만들고 **SMTP 왕복**     → 눈에 띄게 느리다
```

로그인도 같다. 없는 계정은 조회만 하고 던지지만(`AuthServiceImpl.java:126-127`),
있는 계정은 **BCrypt 비교**를 한 번 더 한다(`:130`). BCrypt 는 일부러 느린 함수다.

### 2-4. 안 새는 곳 (근거와 함께)

| 자리 | 왜 안 새는가 |
| --- | --- |
| 로그인 (서버) | 없는 계정·비밀번호 틀림이 **같은 문구**다 — `AuthServiceImpl.java:127` 과 `:131` 이 글자까지 같다 |
| 로그인 (웹) | `LoginForm.tsx:44-56` 이 서버 문구를 **안 쓰고** 자기 고정 문구를 쓴다 |
| 로그인 (앱) | `session.ts:39-41` 이 400·401 을 `InvalidCredentialsError` 하나로 뭉갠다. 서버 문구를 안 싣는다 |
| 인증코드 응답 | 코드를 응답 본문에 안 담는다 — `AuthController.java:114-131`·`384-400` 에 그 판단이 적혀 있다 |
| 소셜 로그인 | 가입 여부로 갈라 말하는 자리를 못 찾았다 (`oauth.tsx`·`social-signup.tsx`·`oauth-redirect` 훑음) |
| 관리자 로그인 | 아래 별도 항목 참고 |

**관리자 로그인 — 안 샌다. 확인 완료** (`src/features/admin/components/auth/AdminLogin.tsx`)

```
:36   로그인이 실패하면 고정 문구 하나다
      「아이디 또는 비밀번호가 올바르지 않습니다.」
      catch 로 받아 **서버 문구를 아예 안 읽는다** — 일반 로그인과 같은 결이다

:51   「관리자 권한이 없는 계정입니다.」 는 갈라 말하는 것처럼 보이지만
      **로그인에 성공해야 닿는 자리다.** 거기까지 가려면 그 계정의 비밀번호를
      이미 알아야 한다 → 열거에는 못 쓴다
```

⚠️ 로그인은 「지금 맞다」일 뿐 **지켜 주는 것이 없었다.** 그래서 이번에 시험을 붙였다(§6).

---

## 3. 선택지와 맞교환

### A안 — 프론트만 뭉갠다 (문구·단계·링크를 하나로)

- 하는 일: `blockedText` 를 없애고 어떤 결과든 「가입된 계정이 있다면 메일을 보냈습니다」로.
- **얻는 것: 사실상 없다.** 서버가 400/200 으로 갈라 답하는 것은 그대로다.
  브라우저 개발자 도구만 열어도 보인다.
- 잃는 것: #838 이 일부러 만든 친절(「아, 카카오로 했었지」)을 잃는다.
- ⇒ **가장 나쁜 맞교환이다.** 안전해진 것처럼 보이는데 안 안전하다.

### B안 — 서버가 늘 같은 답을 하고, 진짜 안내는 메일로 (이슈가 그린 그림)

- 하는 일: `password/reset/send` 가 **무슨 일이 있어도 200 · 같은 문구**를 준다.
  - 이메일 가입 회원 → 인증코드 메일
  - 소셜 가입 회원 → 「카카오로 가입되어 있어요」 안내 메일
  - 회원이 아님 → **아무 메일도 안 보낸다**
  - 세 경우 모두 걸리는 시간을 맞춘다
- 얻는 것: 열거가 실제로 막힌다. 친절은 **메일함**으로 옮겨 살아남는다 —
  메일함을 여는 사람은 그 주소의 주인뿐이라 알려 줘도 된다.
- 잃는 것:
  - 소셜 회원이 비밀번호 찾기에서 **화면으로는 이유를 못 듣는다.** 메일을 봐야 안다.
  - 없는 이메일(오타)을 넣은 사람이 인증코드 칸에서 **오지 않는 메일을 기다린다.**
  - 메일이 안 가는 사람에게도 메일 화면을 보여주게 되어 문의가 늘 수 있다.
- ⇒ **추천한다.** 다만 **서버가 먼저다.**

### C안 — 열거는 놔두고 횟수 제한만 건다

- 하는 일: `email/check`·`password/reset/send` 에 IP·이메일별 횟수 제한을 건다.
- 얻는 것: **대량 훑기**를 막는다. 실무에서 가입 화면은 대개 이 방식이다 —
  가입할 때 「이미 있는 이메일」을 못 알려 주면 서비스를 쓸 수가 없기 때문이다.
- 잃는 것: 표적 한 명을 확인하는 것(「그 사람 여기 회원인가?」)은 못 막는다.
- ⇒ **B안과 같이 간다.** 둘은 겹치지 않고 서로를 메운다.

### 고른 것

```
비밀번호 찾기 · 계정 찾기   → B안 (서버가 늘 같은 답, 안내는 메일로)
회원가입 이메일 중복        → C안 (문구는 그대로 두고 횟수 제한)
로그인                     → 이미 됨. 시험으로 잠근다  ← 이번에 한 것
```

**회원가입만 다르게 가는 까닭**: 가입 화면에서 중복을 안 알려 주면 사람이
「왜 가입이 안 되지」에 갇힌다. 여기서는 쓸모가 안전보다 앞선다고 판단한다.
대신 훑기를 막는 쪽(횟수 제한)으로 대가를 치른다.

---

## 4. 범위 가르기

### 프론트만으로 되는 것 — **이번에 다 했다**

| 할 일 | 상태 |
| --- | --- |
| 웹·앱 **계정 찾기 화면** | ✅ §6 |
| 로그인 화면에서 계정 찾기로 가는 길 | ✅ §6 |
| 「가입 여부를 화면이 말하지 않는다」를 시험으로 잠그기 | ✅ §6-2 |
| 로그인이 갈라 말하지 않는 것을 시험으로 잠그기 | ✅ §6-3 |
| 새는 자리 목록·설계 문서 | ✅ 이 문서 |

### 백엔드가 있어야 되는 것

| 할 일 | 없으면 어떻게 되나 |
| --- | --- |
| `POST /api/auth/account/find` (§5-5) | **화면이 「메일 보냈습니다」라고 하는데 아무 메일도 안 간다** |
| 「가입 방법 알림」 메일 (§5-2) | 위와 같다 |
| 비밀번호 찾기 응답 뭉개기 (§8) | 열거가 그대로 뚫려 있다 |
| 응답 시간 맞추기 (§8) | 문구를 다 지워도 시간으로 갈린다 |
| 횟수 제한 (§5-4) | 이메일 목록으로 전부 훑을 수 있다 |

⚠️ **1단계도 백엔드 없이는 안 굴러간다.** 화면은 다 됐지만 **서버가 붙기 전에는
내보내면 안 된다** — 자세한 것은 §7.

---

## 5. 백엔드에 필요한 변경 (명세 — 코드는 안 고쳤다)

> ⚠️ 저장소 규칙상 백엔드 저장소에는 이슈를 만들지 않는다. 그래서 여기 적는다.
> 대상: `~/Desktop/cmarket_api` (읽기만 했다)
>
> 아래 이름·경로는 **실제 파일을 열어 확인한 것**이다. 기존 규칙을 그대로 따른다.

### 5-1. 지금 있는 것 (확인 완료)

```
AuthController.java        service/cmarket/.../web/auth/controller/AuthController.java
                           /email/check(90) · /email/verification/send(114)
                           · /password/reset/send(384) · /password/reset(450)
EmailService.java          service/cmarket-domain/.../auth/app/service/EmailService.java
                           ⚠️ 메서드가 sendVerificationCode(to, code) **하나뿐**이다
EmailServiceImpl.java      service/cmarket/.../web/auth/service/EmailServiceImpl.java
                           Gmail SMTP. mailEnabled = (mailSender != null) && !fromEmail.isEmpty()
AuthProvider.java          service/cmarket-domain/.../auth/model/AuthProvider.java
                           LOCAL · GOOGLE · KAKAO, displayName() → 이메일 · 구글 · 카카오
SuccessResponse.java       service/cmarket/.../web/common/response/SuccessResponse.java
                           { code, message, data }
SecurityConfig.java        service/cmarket/.../web/common/security/SecurityConfig.java
                           공개 경로 목록이 309~331 행에 있다
```

⚠️ **`displayName()` 이 LOCAL 에 「이메일」을 돌려준다.** 그래서 세 경우(이메일·구글·
카카오)를 **문안 하나로** 덮을 수 있다 — 갈래를 따로 안 만들어도 된다.

### 5-2. 메일 — 인터페이스에 메서드 하나를 더한다

`EmailService` (도메인 계층 인터페이스)

```java
/**
 * 가입 방법 안내 메일.
 *
 * @param to            수신자 이메일
 * @param providerName  AuthProvider.displayName() 값 (이메일 · 구글 · 카카오)
 */
void sendAccountMethodNotice(String to, String providerName);
```

`EmailServiceImpl` (웹 계층 구현체) — 기존 `sendVerificationCode` 와 같은 모양으로 짠다
(`SimpleMailMessage` · `mailEnabled` 갈래 · 실패 시 로그).

```
제목  [Cuddle Market] 로그인 방법 안내
본문  커들마켓은 {providerName}(으)로 가입되어 있어요.

      · 이메일  → 비밀번호로 로그인해주세요. 비밀번호를 잊으셨다면 비밀번호 찾기를 이용해주세요.
      · 구글·카카오 → 비밀번호 대신 {providerName} 로그인을 이용해주세요.

      (웹·앱 로그인 링크)
```

⚠️ 제목 앞머리 `[Cuddle Market]` 는 기존 인증코드 메일과 **같은 표기**다
(`EmailServiceImpl.java:47`). 새로 짓지 말 것.

### 5-3. 엔드포인트

**요청 DTO** — `AccountFindRequest.java` 를 `web/auth/dto/` 에 새로 만든다.

이름은 지어낸 것이 아니라 **그 폴더에 이미 있는 열 개의 결을 따른 것**이다.

```
web/auth/dto/  EmailVerificationSendRequest · EmailVerificationVerifyRequest
               GoogleLoginRequest · LoginRequest · PasswordChangeRequest
               PasswordResetRequest · PasswordResetSendRequest
               RefreshTokenRequest · SignUpRequest · WithdrawalRequest

규칙   주소의 마디를 낙타표기로 이어 붙이고 Request 를 단다
       /password/reset/send  →  PasswordResetSendRequest
       /account/find         →  AccountFindRequest        ← 그래서 이 이름이다
```

⚠️ **응답 DTO 는 안 만든다.** 그 폴더의 `*Response.java` 는 둘뿐이고
(`LoginResponse` · `TokenRefreshResponse`) **돌려줄 알맹이가 있는 것만** 갖고 있다.
문구만 돌려주는 엔드포인트는 `SuccessResponse<String>` 을 그대로 쓴다 —
`/password/reset/send` 가 그 예다(`AuthController.java:384-400`).

⚠️ **도메인 쪽 `*Command` 도 안 만든다.** 값이 이메일 하나뿐이라
`sendPasswordResetCode(String email)` 과 같은 결로 간다. `*Command` 는 값이 여럿일 때
쓴다(`LoginCommand`·`SignUpCommand`·`PasswordChangeCommand`).

모양은 `PasswordResetSendRequest.java` 를 그대로 본뜬다.

```java
@Getter
@NoArgsConstructor
public class AccountFindRequest {
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
}
```

**컨트롤러** — `AuthController` 에 더한다.

```java
@PostMapping("/account/find")
public ResponseEntity<SuccessResponse<String>> findAccount(
        @Valid @RequestBody AccountFindRequest request
) {
    authService.sendAccountMethodNotice(request.getEmail());   // 예외를 던지지 않는다
    return ResponseEntity.status(HttpStatus.OK)
            .body(new SuccessResponse<>(
                    ResponseCode.SUCCESS,
                    "가입된 계정이 있다면 안내 메일을 보냈습니다."));
}
```

**서비스** — `AuthService` / `AuthServiceImpl`

```java
public void sendAccountMethodNotice(String email) {
    userRepository.findByEmailAndDeletedAtIsNull(email)
        .ifPresent(user -> emailService.sendAccountMethodNotice(
                email, user.getProvider().displayName()));
    // ⚠️ orElseThrow 를 쓰지 않는다. 없는 이메일이면 **조용히 아무것도 안 한다.**
    //    던지는 순간 400 이 나가고, 그게 곧 「이 이메일은 회원이 아니다」가 된다.
}
```

**공개 경로** — `SecurityConfig` 의 `permitAll()` 목록(309~331 행)에 더한다.

```java
"/api/auth/account/find",
```

⚠️ **빠뜨리면 401 이 난다.** 화면은 그래도 「메일 보냈습니다」라고 말하므로
(열거를 막으려고 일부러 그렇게 만들었다) **아무도 못 알아챈다.** 잊지 말 것.

### 5-4. 횟수 제한

| 대상 | 기준 |
| --- | --- |
| `POST /auth/account/find` | IP 당 + **이메일 당** |
| `GET /auth/email/check` | IP 당 · 분당 몇 회 |
| `POST /auth/password/reset/send` | IP 당 + 이메일 당 |
| `POST /auth/login` | IP 당 + 계정 당 |

⚠️ **막았을 때도 같은 200 을 준다.** 429 를 주면 「막힐 만큼 눌렀다」가 또 하나의 신호다.
(⚠️ 계정 찾기 화면은 429 를 받아도 같은 글자를 보여주므로 화면 쪽은 이미 안전하다.)

### 5-5. 응답 시간 — ⚠️ **비동기 설정은 이미 있다. 갈림길은 다른 데 있다**

`sendAccountMethodNotice` 도 **메일 발송이 요청 스레드에 있으면** 회원일 때만 느려진다
(`EmailServiceImpl.java:50` 의 `mailSender.send()` 가 SMTP 왕복을 그 자리에서 기다린다).

**그런데 「`@Async` + `TaskExecutor` 를 새로 넣는다」는 틀린 말이다.** 실물을 열어 보면
둘 다 이미 있다 — `web/notification/config/AsyncConfig.java`.

```java
@Configuration
@EnableAsync                                    // ← 이미 켜져 있다
public class AsyncConfig {
    @Bean(name = "notificationTaskExecutor")    // ← Executor 빈도 이미 있다
    public Executor notificationTaskExecutor() {
        // corePoolSize 5 · maxPoolSize 10 · queueCapacity 100
        // threadNamePrefix "notification-async-"
    }
}
```

**진짜 갈림길은 「어느 풀에서 돌릴 것인가」다.**

```
A안  @Async 를 이름 없이 붙인다
     쉽다. 그런데 메일이 **알림용 풀을 함께 쓰게 될** 수 있다.
     SMTP 왕복은 느려서(수백 ms~수 초) 큐(100칸)를 먹고 **알림이 밀린다.**
     풀 이름도 notification-async- 라 로그에서 메일인지 알림인지 안 갈린다

B안  메일 전용 Executor 를 하나 더 만들고 @Async("mailTaskExecutor") 로 콕 집는다
     한 줄 더 쓰는 대신 둘이 서로 안 밀고, 로그에서도 갈린다
```

⇒ **B안을 권한다.** 지금 풀은 이름부터 「알림 전용」이라고 적혀 있다(주석 그대로).

【추정 — 확인 필요】 스프링 부트는 사용자가 `Executor` 빈을 정의하면 기본 executor
자동설정을 물러서므로(`@ConditionalOnMissingBean(Executor.class)`), **A안에서 그 빈이
유일해져 `@Async` 가 그것을 집을 공산이 크다.** 다만 이 맥에서는 컴파일이 안 돼
(JDK 11, 프로젝트 21) **직접 돌려서 확인하지 못했다.** 붙이는 사람이 스레드 이름
(`notification-async-*`)을 로그로 보고 확인해야 한다.

2단계(§8-3)의 응답 시간 맞추기와 **같은 작업**이라 같이 하면 된다.

### 5-6. 곁다리 (열거는 아니지만 같이 볼 것)

`AuthServiceImpl.isEmailAvailable()` 은 `existsByEmail()` 을 쓴다(`:303-306`).
**탈퇴한 사용자도 센다.** 반면 비밀번호 찾기·계정 찾기는 `findByEmailAndDeletedAtIsNull()`
이다. 그래서 탈퇴한 이메일은 「가입은 안 되는데(중복) 계정도 못 찾는」 상태가 된다.

---

## 6. 이번에 만든 것 (프론트)

### 6-1. 계정 찾기 화면

| 파일 | 하는 일 |
| --- | --- |
| `src/app/(main)/auth/find-account/page.tsx` | 웹 라우트. 비밀번호 찾기 라우트와 같은 틀 |
| `src/features/find-account/FindAccountPage.tsx` | 웹 화면 껍데기 (제목·설명) |
| `src/features/find-account/components/FindAccountForm.tsx` | 웹 폼. **열거를 막는 핵심이 여기 있다** |
| `src/lib/api/auth.ts` | `findAccount(email)` 추가. **돌려주는 값이 없다** |
| `src/constants/routes.ts` | `FIND_ACCOUNT: '/auth/find-account'` |
| `src/features/login/components/LoginForm.tsx` | 「가입 방법을 잊으셨나요?」 링크 추가 |
| `mobile/app/find-account.tsx` | 앱 화면 |
| `mobile/lib/find-account/api.ts` | 앱 API. **서버 응답을 여기서 버린다** |
| `mobile/app/login.tsx` | 로그인 관문 아래 「계정 찾기」 링크 추가 |

**어떻게 「가입 여부를 말하지 않는다」를 보장했나 — 세 겹이다.**

```
① 상태에 담을 자리가 없다
   웹  FindAccountForm.tsx   useState<'idle' | 'sent' | 'offline'>
   앱  find-account.tsx      같은 셋
   서버 문구를 담는 칸이 아예 없다. 담을 곳이 없으면 실수로 뿌릴 수도 없다.
   ⚠️ 비밀번호 찾기는 담아 둔다 — FindPasswordForm.tsx 의 sendValidCodeResult.message

② 갈래가 「닿았나 못 닿았나」 둘뿐이다
   웹  FindAccountForm.tsx   if (isAxiosError(error) && error.response) → 'sent'
   앱  lib/find-account/api.ts  fetch 가 거절할 때만 NetworkUnreachableError
   상태 코드도 문구도 안 본다. 200·400·404·500 이 전부 같은 자리로 간다.

③ 문구가 상수 하나다
   웹  SENT_MESSAGE          앱  SENT_MESSAGE (글자까지 같다)
```

**왜 404 를 따로 다루지 않나** — 프론트는 「엔드포인트가 없어서 404」와 「그런 계정이
없어서 404」를 **구분할 방법이 없다.** 같은 상태 코드다. 구분하려 드는 순간 그 구분이
곧 열거 통로가 된다.

**「닿지 못했다」만 다른 말을 하는데 새지 않나** — 안 샌다. 그 갈래는 **넣은 이메일과
아무 상관이 없다.** 비행기 모드에서는 어떤 이메일을 넣어도 같은 문구가 나온다.
열거는 「이메일에 따라 화면이 갈리는 것」이지 「화면이 두 종류인 것」이 아니다.

### 6-2. 계정 찾기 회귀 시험

| 파일 | 건수 |
| --- | --- |
| `src/features/find-account/components/FindAccountForm.test.tsx` | 4 |
| `mobile/__tests__/find-account-screen.test.tsx` | 8 |

서버가 낼 수 있는 답 다섯(200 정상 · 200 소셜 · 400 없는 이메일 · 404 · 500)을
**죄다 넣어 보고 화면 글자가 하나도 안 달라지는지** 본다.

### 6-3. 로그인 회귀 시험

로그인은 **이미 누구에게나 같은 문구**를 쓴다. 그런데 웹에는 그것을 지키는 시험이
**하나도 없었고**, 앱에는 「400이면 InvalidCredentialsError 를 던진다」가 있었지만
그건 **오류의 종류**만 본다 — 서버 문구가 실려 나오는지는 안 본다.

| 파일 | 하는 일 |
| --- | --- |
| `src/features/login/components/LoginForm.test.tsx` (새로 만듦) | 서버 문구를 **서로 다르게 두 번** 주고 화면 글이 그대로인지 본다. 3건 |
| `mobile/lib/auth/session.test.ts` (있던 파일 끝에 덧붙임) | 서버가 어떤 문구를 줘도 오류에 그 문구가 **안 실리는지** 본다. 3건 |

**왜 「문구가 이렇다」로 안 쓰나.** 진짜 회귀는 이 모양으로 온다.

```ts
setError('root', { message: error.response?.data?.message })   // 서버 문구를 그대로
```

이 저장소의 다른 화면들이 실제로 저렇게 쓴다(`FindPasswordForm`·`SignUpForm`).
「문구가 A 다」로 시험하면 서버가 A 를 주는 동안은 회귀를 심어도 통과한다.
그래서 **원인(서버 문구를 쓰는가)** 을 직접 본다 — 저장소 규칙(`CLAUDE.md`)의
「결과 말고 원인을 보는 시험을 써라」와 같은 이야기다.

### 6-4. 마커 검증

시험이 진짜로 잡는지 **회귀를 심어서** 확인했다. 넷 다 심고 → 실패를 보고 → 되돌렸다.

```
웹 계정찾기   404 를 따로 다루게 고침            → 4건 중 2건 실패
앱 계정찾기   404 면 NetworkUnreachable 던지게   → 8건 중 1건 실패
웹 로그인     error.response.data.message 사용   → 3건 모두 실패
앱 로그인     throw new Error(body.message)      → 새 3건 + 기존 1건 실패
```

---

## 7. ⚠️ 서버가 붙기 전에 내보내면 안 된다

**계정 찾기 화면은 지금 「메일 보냈습니다」라고 말하는데, 서버 엔드포인트가 없어
아무 메일도 안 간다.** 404 가 와도 같은 글자를 보여주기 때문이다.

이건 실수가 아니라 **어쩔 수 없는 것**이다(§6-1 「왜 404 를 따로 다루지 않나」).
프론트가 두 종류의 404 를 구분하려 드는 순간 그게 열거 통로가 된다.

그래서 내보내는 순서를 못 박는다.

```
1  백엔드 §5-2 · §5-3 배포          ← 먼저
2  실제로 메일이 오는지 눈으로 확인   ← §9 의 환경변수 확인 포함
3  프론트 배포                      ← 그다음
```

⚠️ 순서를 지킬 수 없다면 **링크를 먼저 숨기는 편이 낫다**(로그인 화면의 두 곳).
화면이 있어도 갈 길이 없으면 아무도 안 들어온다.

---

## 8. 2단계 설계 (이번에 **구현 안 했다**, 글로만)

계정 찾기가 자리를 잡으면 그때 한다. 그때는 **잃을 친절이 없다** — 갈 곳이 생겼으니까.

### 8-1. 비밀번호 찾기 응답 뭉개기 (서버)

`AuthServiceImpl.sendPasswordResetCode()` (`:187-213`)

```
사용자를 찾는다
  ├ 없다              → 아무것도 안 한다 (메일 X)
  ├ 소셜(LOCAL 아님)   → 「가입 방법 알림」 메일을 보낸다  ← §5-2 것을 그대로 쓴다
  └ LOCAL             → 지금처럼 인증코드 메일을 보낸다
어느 쪽이든 예외를 던지지 않는다 → 늘 200
message: "가입된 계정이 있다면 안내 메일을 보냈습니다."
```

⚠️ **`resetPassword()`(`:216-229`) 는 그대로 둔다.** 거기는 인증코드를 통과한 사람만
오는 자리라 갈라 말해도 안 샌다. 오히려 뭉개면 「왜 안 바뀌지」가 된다.

### 8-2. 비밀번호 찾기 화면 (프론트)

- `blockedText()` 와 `blocked` 갈래를 **통째로 걷어낸다**
  (웹 `FindPasswordForm.tsx:35-46`·`:127-140`, 앱 `find-password.tsx:43-52`·`api.ts:57-62`)
- 서버가 늘 200 이므로 **누구나 2단계(인증코드 칸)로 간다.** 소셜·없는 이메일인 사람은
  코드가 안 오고 대신 안내 메일이 온다
- 2단계 헤더 문구에 한 줄 더한다 — 「메일이 오지 않으면 가입 방법이 다를 수 있어요」

⚠️ **이때 잃는 것**: 오타를 낸 사람이 인증코드 칸에서 오지 않는 메일을 기다린다.
계정 찾기가 있어도 이건 남는다. 문의가 늘 수 있다는 것을 알고 하는 것이다.

### 8-3. 응답 시간 (서버)

§5-5 와 같은 작업이고, **거기 적은 갈림길(어느 스레드 풀을 쓸 것인가)을 그대로 따른다.**
비밀번호 재설정 메일도 계정 찾기 메일과 같은 길로 나가므로 한 번에 정리된다.

### 8-4. 회원가입 이메일 중복은 **뭉개지 않는다**

가입 화면에서 중복을 안 알려 주면 사람이 「왜 가입이 안 되지」에 갇힌다.
여기서는 쓸모가 안전보다 앞선다고 판단한다. 대신 **횟수 제한**(§5-4)으로 대량 훑기를 막는다.

---

## 9. 사람이 확인해야 할 것

1. ⚠️ **EC2 에 메일 환경변수가 들어 있는가.** `application-prod.properties` 의
   `MAIL_USERNAME`·`MAIL_PASSWORD` 가 비어 있으면 `EmailServiceImpl` 의
   `mailEnabled` 가 false 가 되어 **메일을 안 보내고 로그만 남긴다**
   (`EmailServiceImpl.java:35`·`:52-58`). 지금 회원가입 인증코드가 실제로 오고 있다면
   들어 있는 것이지만, **눈으로 확인해야 확실하다.**
   (⚠️ `ps -ef` 에 비밀번호가 그대로 보인다 — 출력을 붙여넣지 말 것)
2. 백엔드 §5-2·§5-3 을 누가 언제 붙일 것인가 — 그전에는 프론트를 내보내면 안 된다(§7)
3. 2단계(§8)를 언제 할 것인가

---

## 10. 남은 위험 · 확신 없는 것

- **엔드포인트 이름을 내가 정했다.** `POST /api/auth/account/find` 는 기존 규칙
  (`/auth/password/reset/send` 등)을 본떴을 뿐, 백엔드와 합의한 것이 아니다.
  다르게 정하면 프론트 두 곳만 고치면 된다(`src/lib/api/auth.ts` · `mobile/lib/find-account/api.ts`).
- **앱 이메일 로그인 화면의 문구가 어긋나 있다**(이번 범위 밖, 고치지 않았다).
  `mobile/components/auth/login-form.tsx:73` 이 「**아래** 소셜 로그인을 이용해주세요」라고
  하는데, 그 화면(`app/email-login.tsx`)에는 **소셜 단추가 없다.** 웹은 같은 화면에
  단추가 있어 맞는 말이다. 2단계 때 같이 볼 것.
- **소셜 로그인**은 카카오·구글 **자기네 화면**에서 무엇을 보여주는지 확인 못 했다(저장소 밖).
- 횟수 제한을 서버 어디에 걸지(필터·인터셉터·게이트웨이)는 정하지 않았다.
- §5-5 처럼 메일을 비동기로 떼어내면 **메일 실패가 조용해진다.** 로그를 안 보면 못 알아챈다.
  게다가 계정 찾기 화면은 **일부러** 실패를 안 보여주므로(열거 방지) 화면으로도 못 알아챈다.
