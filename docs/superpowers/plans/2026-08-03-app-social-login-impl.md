# 앱 소셜 로그인 구현 계획 (12바퀴)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에 카카오·구글 간편 로그인을 붙인다. 웹이 쓰는 서버 흐름을 그대로 쓰되 돌아올 곳만 앱으로 가른다.

**Architecture:** 앱이 `expo-web-browser`로 서버의 `/oauth2/authorization/{provider}?client=app`을 연다. 서버는 `client` 값을 쿠키에 맡겨 두었다가, 성공·실패 핸들러에서 읽어 **앱 스킴(`cuddlemarket://oauth`)** 으로 돌려보낸다. 앱은 돌아온 주소에서 토큰을 꺼내 기존 SecureStore 자리에 저장하고, 프로필이 덜 찼으면 「추가 정보 입력」으로 보낸다.

**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · expo-web-browser ~15.0.11 · Spring Boot(JDK 21) · vitest(shared·웹) · Jest(앱)

설계: `docs/superpowers/specs/2026-08-03-app-social-login-design.md` · 이슈 #828 · 브랜치 `feature/828--app-social-login`

## Global Constraints

- **앱은 Expo SDK 54에 고정**돼 있다. 새 꾸러미를 넣을 때 `@latest`를 쓰지 마라 — 사용자 폰의 Expo Go가 54다. 넣어야 하면 `npx expo install <이름>`으로 SDK에 맞는 판을 받는다.
- **이번 바퀴에 새 꾸러미는 없다.** `expo-web-browser`가 이미 있다(`~15.0.11`).
- **문구는 웹 그대로.** 「카카오 간편 로그인」·「구글 간편 로그인」·「추가 정보 입력」·「서비스 이용을 위해 아래 정보가 필요합니다」. 새로 짓지 마라.
- **돌아갈 주소를 파라미터로 받지 마라.** 앱이 보내는 것은 `client=app` 깃발 하나뿐이고, 실제 주소는 서버 설정에 못 박는다. 주소를 그대로 받아 쓰면 남이 만든 주소로 토큰이 날아간다(오픈 리다이렉트).
- **커스텀 스킴은 Expo Go에서 안 돈다.** Task 10에서 개발 빌드를 만들기 전까지 소셜 로그인은 끝까지 확인할 수 없다. 그전 과제들은 게이트와 시험으로만 확인한다.
- **백엔드는 이 맥에서 컴파일이 안 된다**(JDK 11, 프로젝트는 21). 서버 과제는 **코드를 읽고 고치는 것까지**만 하고, 확인은 배포 뒤 실기기로 한다.
- 게이트는 저장소 루트에서 친다: `pnpm gate:shared` · `pnpm gate:mobile` · `pnpm gate` · `pnpm gate:all`
- 커밋 메시지는 한글, 끝에 `(#828)`.

## 서버가 이미 갖고 있는 것 (읽고 확인함 — 지어내지 말 것)

```
HttpCookieOAuth2AuthorizationRequestRepository
  :31  OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request"
  :36  REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri"
  :42  COOKIE_EXPIRE_SECONDS = 180
  :86  request.getParameter("redirect_uri")를 읽어 쿠키에 담는다   ← 장치가 절반 깔려 있다
  :124 removeAuthorizationRequestCookies()가 두 쿠키를 지운다

OAuth2LoginSuccessHandler
  :34  @Value("${oauth2.redirect-uri:...}")  ← 한 값으로만 보낸다
  :66  "%s?accessToken=%s&refreshToken=%s"
  :83  response.sendRedirect(redirectUrl)

SecurityConfig
  :174 oauth2Login(...)  successHandler(oAuth2LoginSuccessHandler)
  :189 failureHandler(람다)  → 로그를 잔뜩 찍고 FRONTEND_URL 로그인 페이지로 보낸다

CookieUtils
  getCookie(request, name) : Optional<Cookie>
  addCookie(response, name, value, maxAge)
  deleteCookie(request, response, name)
```

⚠️ **`redirect_uri` 쿠키를 쓰지 마라.** 프론트가 준 주소를 그대로 담기 때문에, 성공 핸들러가 그걸 읽게 만들면 오픈 리다이렉트가 된다. 지금은 아무도 안 읽어서 무해하다. 우리는 **새 쿠키 `client`** 를 쓴다.

## 파일 구조

```
packages/shared/src/lib/socialSignup.ts        needsSocialSignup(user)
packages/shared/src/lib/socialSignup.test.ts
packages/shared/src/index.ts                   내보내기 한 줄

src/features/SocialCallback.tsx                박힌 판정을 shared 함수로 (웹)

mobile/lib/auth/social.ts                      돌아온 주소 파싱 + 브라우저 열기
mobile/lib/auth/social.test.ts
mobile/lib/profile.ts                          MyProfile에 birthDate · updateMe()
mobile/components/auth/social-login-buttons.tsx
mobile/components/signup/birth-date-field.tsx  폼 훅에서 떼어내기 + FieldLabel
mobile/app/login.tsx                           단추 붙이기
mobile/app/social-signup.tsx                   추가 정보 입력
mobile/app/_layout.tsx                         루트 스택에 화면 등록
mobile/eas.json                                development 프로필

cmarket_api  (컴파일 불가 — 읽고 고치기만)
  HttpCookieOAuth2AuthorizationRequestRepository.java   client 쿠키 심기
  OAuth2LoginSuccessHandler.java                        쿠키 읽어 분기
  SecurityConfig.java                                   실패 핸들러도 같은 분기
  application-prod.properties                           앱 주소 + kakao scope
```

## 과제 순서와 나눌 수 있는 것

```
Task 1   shared needsSocialSignup       ← 혼자 갈 수 있다
Task 2   웹이 shared를 쓰게              ← Task 1 뒤
Task 3   서버 (쿠키·핸들러·설정)          ← 혼자 갈 수 있다. **배포는 리드가**
Task 4   돌아온 주소 파싱                ← 혼자 갈 수 있다
Task 5   브라우저 열고 로그인 마무리       ← Task 4 뒤
Task 6   소셜 단추 + 로그인 화면          ← Task 5 뒤
Task 7   BirthDateField 떼어내기         ← 혼자 갈 수 있다
Task 8   profile updateMe + birthDate    ← 혼자 갈 수 있다
Task 9   추가 정보 입력 화면              ← Task 1·7·8 뒤
Task 10  개발 빌드                       ← Task 6·9 뒤
Task 11  실기기 확인 + PR                ← 마지막 (리드·사용자)
```

**나란히 돌릴 수 있는 묶음**: `{1, 3, 4, 7, 8}` → `{2, 5}` → `{6, 9}` → `{10}` → `{11}`

**리드가 할 일**: 묶음마다 직접 게이트를 돌리고 「⚠️」 자리를 눈으로 본다. **팬은 계획서를 의심하지 않는다** — 11바퀴에도 계획서가 틀린 곳(펫 세부 41개, `manipulateAsync`)이 있었고 팬이 세 번 다 잡아냈다. 계획서와 파일이 다르면 **파일 쪽이 맞다. 지어내지 말고 먼저 알려라.**

---

# Task 1: shared — 추가 정보가 필요한지 판정

**Files:**
- Create: `packages/shared/src/lib/socialSignup.ts`
- Create: `packages/shared/src/lib/socialSignup.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `needsSocialSignup(user: SocialSignupCheck): boolean` · `interface SocialSignupCheck { addressSido: string | null; birthDate: string | null }`

**왜 필요한가**: 웹은 `SocialCallback.tsx:23`에 `!user.addressSido || !user.birthDate`가 박혀 있다. 앱도 같은 판정이 필요한데 베끼면 두 벌이 된다. 10바퀴에 답글 깊이 규칙이 두 벌이라 양쪽 다 틀렸던 것과 같은 자리다.

- [ ] **Step 1: 시험을 먼저 쓴다**

`packages/shared/src/lib/socialSignup.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { needsSocialSignup } from './socialSignup'

// 소셜로 처음 들어오면 서버가 birthDate·addressSido를 null로 만든다
// (OAuth2UserPersistenceService.createNewUser). 그 둘이 채워졌는지로 판정한다.
//
// 웹 SocialCallback.tsx에 박혀 있던 규칙을 그대로 옮겼다. 두 벌로 두면 갈라진다.

describe('needsSocialSignup', () => {
  it('둘 다 차 있으면 추가 정보가 필요 없다', () => {
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: '1988-04-03' })).toBe(false)
  })

  it('지역이 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: null, birthDate: '1988-04-03' })).toBe(true)
  })

  it('생년월일이 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: null })).toBe(true)
  })

  it('둘 다 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: null, birthDate: null })).toBe(true)
  })

  it('빈 글자도 안 채운 것으로 본다 — 서버가 null 대신 빈 글자를 줄 수도 있다', () => {
    expect(needsSocialSignup({ addressSido: '', birthDate: '1988-04-03' })).toBe(true)
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: '' })).toBe(true)
  })
})
```

- [ ] **Step 2: 빨간 것을 확인한다**

```bash
pnpm gate:shared
```

기대: `Cannot find module './socialSignup'`

- [ ] **Step 3: 만든다**

`packages/shared/src/lib/socialSignup.ts`:

```ts
// 소셜로 로그인한 사람에게 추가 정보를 더 받아야 하는지. 웹과 앱이 같이 쓴다.
//
// 왜 shared인가: 서버가 소셜 가입자를 만들 때 birthDate·addressSido를 null로 두기
// 때문에 생기는 규칙이라(OAuth2UserPersistenceService.createNewUser) 웹과 앱이
// 다를 이유가 없다. 웹 SocialCallback.tsx에 박혀 있던 것을 여기로 옮겼다.

/** 판정에 필요한 두 값만 받는다. 화면마다 담는 그릇이 달라서다 */
export interface SocialSignupCheck {
  addressSido: string | null
  birthDate: string | null
}

/**
 * 「추가 정보 입력」 화면으로 보내야 하나.
 *
 * 이메일로 가입한 사람은 가입 폼에서 둘 다 받으므로 여기 걸리지 않는다.
 */
export function needsSocialSignup(user: SocialSignupCheck): boolean {
  return !user.addressSido || !user.birthDate
}
```

- [ ] **Step 4: 내보낸다**

`packages/shared/src/index.ts` 맨 아래에 한 줄 더한다:

```ts
export * from './lib/socialSignup'
```

- [ ] **Step 5: 초록을 확인한다**

```bash
pnpm gate:shared
```

- [ ] **Step 6: 커밋**

```bash
git add packages/shared/src/lib/socialSignup.ts packages/shared/src/lib/socialSignup.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): 소셜 로그인 뒤 추가 정보가 필요한지 판정 (#828)"
```

- [ ] **Step 7: 리드에게 보고**

무엇을 내보냈는지(`needsSocialSignup`·`SocialSignupCheck`)와 게이트 결과를 적는다.

---

# Task 2: 웹이 shared 판정을 쓰게

**Files:**
- Modify: `src/features/SocialCallback.tsx:23`

**Interfaces:**
- Consumes: `needsSocialSignup` (Task 1)
- Produces: 없음

**지금 코드** (`src/features/SocialCallback.tsx:20-27`):

```tsx
const userResponse = await api.get('/profile/me')
const user = userResponse.data.data

if (!user.addressSido || !user.birthDate) {
  sessionStorage.setItem('socialSignupUser', JSON.stringify(user))
  router.push('/auth/social-signup')
  return
}
```

- [ ] **Step 1: 판정만 바꾼다**

```tsx
import { needsSocialSignup } from '@cuddle/shared'
```

```tsx
if (needsSocialSignup(user)) {
  sessionStorage.setItem('socialSignupUser', JSON.stringify(user))
  router.push('/auth/social-signup')
  return
}
```

**나머지는 손대지 마라.** `sessionStorage`도, 라우팅도 그대로다. 이 과제는 판정 한 줄을 옮기는 것뿐이다.

- [ ] **Step 2: 웹 게이트**

```bash
pnpm gate
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/SocialCallback.tsx
git commit -m "refactor(web): 소셜 추가 정보 판정을 shared에서 가져온다 (#828)"
```

- [ ] **Step 4: 리드에게 보고**

---

# Task 3: 서버 — 앱에서 시작하면 앱으로 돌려보낸다

**Files:**
- Modify: `~/Desktop/cmarket_api/.../security/HttpCookieOAuth2AuthorizationRequestRepository.java`
- Modify: `~/Desktop/cmarket_api/.../security/OAuth2LoginSuccessHandler.java`
- Modify: `~/Desktop/cmarket_api/.../security/SecurityConfig.java` (실패 핸들러)
- Modify: `~/Desktop/cmarket_api/service/cmarket/src/main/resources/application-prod.properties`

**Interfaces:**
- Consumes: 없음
- Produces: 앱이 쓰는 계약 — `/oauth2/authorization/{provider}?client=app` → `cuddlemarket://oauth?accessToken=…&refreshToken=…` (실패면 `cuddlemarket://oauth?error=…`)

⚠️ **이 맥에서는 컴파일이 안 된다**(JDK 11, 프로젝트 21). 고치고 나서 `./gradlew build`를 돌리려 하지 마라. 확인은 배포 뒤 실기기(Task 11)로 한다.

⚠️ **백엔드는 main에 직접 커밋한다** (전역 규칙의 예외 — 저장소 루트 `CLAUDE.md` 참고).

- [ ] **Step 1: 인가 요청을 시작할 때 `client` 깃발을 쿠키에 심는다**

`HttpCookieOAuth2AuthorizationRequestRepository.java`

상수를 더한다(`REDIRECT_URI_PARAM_COOKIE_NAME` 옆):

```java
    /**
     * 어느 쪽에서 로그인을 시작했나. "app"이면 앱 스킴으로 돌려보낸다.
     *
     * ⚠️ 주소가 아니라 **깃발**이다. 주소를 받아 그대로 쓰면 남이 만든 주소로 토큰이 날아간다
     *    (오픈 리다이렉트). 실제 주소는 application.properties에 못 박혀 있다.
     */
    public static final String CLIENT_PARAM_COOKIE_NAME = "oauth2_client";
```

`saveAuthorizationRequest()` 안, `redirect_uri` 쿠키를 담는 블록 **바로 아래**에 더한다:

```java
        // 앱에서 시작했으면 깃발을 남겨 둔다. 카카오·구글에 다녀오는 동안 서버는
        // 아무것도 기억하지 않으므로(STATELESS) 쿠키에 맡긴다.
        String client = request.getParameter("client");
        if (StringUtils.hasText(client)) {
            CookieUtils.addCookie(
                    response,
                    CLIENT_PARAM_COOKIE_NAME,
                    client,
                    COOKIE_EXPIRE_SECONDS
            );
        }
```

`removeAuthorizationRequestCookies()`에 삭제를 더한다:

```java
        CookieUtils.deleteCookie(request, response, CLIENT_PARAM_COOKIE_NAME);
```

- [ ] **Step 2: 성공 핸들러가 깃발을 보고 가른다**

`OAuth2LoginSuccessHandler.java`

값을 하나 더 받는다(`redirectUri` 아래):

```java
    /** 앱에서 시작했을 때 돌아갈 곳. 커스텀 스킴이라 웹 주소와 섞이지 않는다 */
    @Value("${oauth2.app-redirect-uri:cuddlemarket://oauth}")
    private String appRedirectUri;
```

⚠️ **쿠키를 지우기 전에 읽어야 한다.** 지금 코드는 3단계에서 쿠키를 지우고 4단계에서 주소를 만든다. 순서를 지키지 않으면 늘 웹으로 간다.

`onAuthenticationSuccess`의 3~4단계를 이렇게 바꾼다:

```java
        // 3. 어디로 돌아갈지 먼저 정한다 — 쿠키를 지우기 **전에** 읽어야 한다
        boolean fromApp = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.CLIENT_PARAM_COOKIE_NAME)
                .map(cookie -> "app".equals(cookie.getValue()))
                .orElse(false);
        String target = fromApp ? appRedirectUri : redirectUri;

        // 4. OAuth2 인증 관련 쿠키 삭제
        cookieAuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // 5. 돌려보낸다 (토큰을 쿼리 파라미터로 전달)
        String redirectUrl = String.format(
                "%s?accessToken=%s&refreshToken=%s",
                target,
                accessToken,
                refreshToken
        );
```

아래 로그의 `redirectUri`도 `target`으로 바꾼다.

- [ ] **Step 3: 실패해도 앱으로 돌려보낸다**

`SecurityConfig.java`의 `failureHandler` 람다. **로그를 찍는 부분은 손대지 마라.** 맨 끝, 프론트엔드 로그인 페이지로 보내는 자리만 앞에 분기를 더한다:

```java
                    // 앱에서 시작했으면 앱으로 돌려보낸다.
                    // 안 그러면 브라우저 창 안에 웹 로그인 페이지가 떠서, 사용자는
                    // 앱으로 돌아갈 길을 잃는다.
                    boolean fromApp = CookieUtils.getCookie(request,
                                    HttpCookieOAuth2AuthorizationRequestRepository.CLIENT_PARAM_COOKIE_NAME)
                            .map(cookie -> "app".equals(cookie.getValue()))
                            .orElse(false);
                    if (fromApp) {
                        String appUrl = "cuddlemarket://oauth?error="
                                + java.net.URLEncoder.encode(errorMessage, java.nio.charset.StandardCharsets.UTF_8);
                        response.sendRedirect(appUrl);
                        return;
                    }
```

- [ ] **Step 4: 설정 두 줄**

`application-prod.properties`

```properties
# 앱에서 시작한 소셜 로그인이 돌아갈 곳. 커스텀 스킴이라 웹과 섞이지 않는다
oauth2.app-redirect-uri=cuddlemarket://oauth
```

그리고 카카오 scope에 이메일을 더한다:

```properties
spring.security.oauth2.client.registration.kakao.scope=profile_nickname,account_email
```

⚠️ **이 한 줄이 3-1 결함을 고친다.** 지금은 이메일이 안 와서 서버가 `kakao_{socialId}@kakao.local`이라는 가짜 주소를 만들고, 그 탓에 「같은 이메일이면 기존 계정에 붙이는」 장치가 통째로 안 돈다. 콘솔에서는 `account_email`이 이미 「필수 동의 [수집]」으로 켜져 있다(확인함).

- [ ] **Step 5: 서버 문서도 맞춘다**

`~/Desktop/cmarket_api/documents/API문서/OAuth2_로그인_흐름.md`에 앱 흐름을 짧게 더한다. 이 문서는 `scope=profile_nickname account_email`이라고 이미 적고 있어 설정과 어긋나 있었다 — Step 4로 어긋남이 사라진다.

- [ ] **Step 6: 커밋 (백엔드 저장소, main에 직접)**

```bash
cd ~/Desktop/cmarket_api
git add -A
git commit -m "feat: 앱에서 시작한 소셜 로그인은 앱 스킴으로 돌려보낸다"
```

- [ ] **Step 7: 리드에게 보고**

```
바꾼 파일과 줄
컴파일·시험을 **안 돌렸다**는 사실 (이 맥에서는 불가능하다)
배포가 필요하다는 것 — 리드가 한다
```

---

# Task 4: 앱 — 돌아온 주소에서 토큰 꺼내기

**Files:**
- Create: `mobile/lib/auth/social.ts`
- Create: `mobile/lib/auth/social.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `type SocialProvider = 'kakao' | 'google'` · `parseOAuthCallback(url: string): OAuthCallback` · `type OAuthCallback = { kind: 'tokens'; accessToken: string; refreshToken: string } | { kind: 'error'; message: string } | { kind: 'unknown' }`

**왜 순수 함수로 떼나**: 브라우저를 여는 부분은 시험하기 어렵지만 **주소를 읽는 부분은 순수하다.** 토큰이 하나만 오거나 파라미터가 엉뚱할 때를 시험으로 덮어 둘 수 있다.

- [ ] **Step 1: 시험을 먼저 쓴다**

`mobile/lib/auth/social.test.ts`:

```ts
import { parseOAuthCallback } from './social';

// 서버가 이렇게 돌려보낸다(OAuth2LoginSuccessHandler):
//   cuddlemarket://oauth?accessToken=…&refreshToken=…
// 실패하면:
//   cuddlemarket://oauth?error=…

describe('parseOAuthCallback', () => {
  it('토큰 둘이 다 있으면 꺼낸다', () => {
    const result = parseOAuthCallback('cuddlemarket://oauth?accessToken=aaa&refreshToken=bbb');

    expect(result).toEqual({ kind: 'tokens', accessToken: 'aaa', refreshToken: 'bbb' });
  });

  it('리프레시 토큰이 없으면 못 쓴다 — 만료됐을 때 되살릴 방법이 없다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth?accessToken=aaa')).toEqual({ kind: 'unknown' });
  });

  it('액세스 토큰이 없어도 못 쓴다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth?refreshToken=bbb')).toEqual({ kind: 'unknown' });
  });

  it('error가 오면 그 문구를 준다', () => {
    const result = parseOAuthCallback('cuddlemarket://oauth?error=%EC%9D%B8%EC%A6%9D%EC%97%90%20%EC%8B%A4%ED%8C%A8%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4');

    expect(result).toEqual({ kind: 'error', message: '인증에 실패했습니다' });
  });

  it('아무 파라미터도 없으면 모른다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth')).toEqual({ kind: 'unknown' });
  });

  it('주소가 엉망이어도 던지지 않는다 — 던지면 앱이 죽는다', () => {
    expect(parseOAuthCallback('!!! 주소가 아님')).toEqual({ kind: 'unknown' });
  });
});
```

- [ ] **Step 2: 빨간 것을 확인한다**

```bash
pnpm --filter ./mobile exec jest lib/auth/social.test.ts
```

- [ ] **Step 3: 만든다**

`mobile/lib/auth/social.ts`:

```ts
// 소셜 로그인. 브라우저로 서버 흐름을 태우고, 돌아온 주소에서 토큰을 꺼낸다.
//
// 왜 브라우저인가: 카카오·구글을 한 방식으로 덮을 수 있고 네이티브 설정이 없다.
// 1.1에서 둘 다 네이티브 SDK로 바꾼다(설계 §2④).

/** 서버에 등록된 제공자. 네이버는 지도용이라 로그인에 없다 */
export type SocialProvider = 'kakao' | 'google';

export type OAuthCallback =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'error'; message: string }
  | { kind: 'unknown' };

/**
 * 서버가 돌려보낸 주소를 읽는다.
 *
 *   성공  cuddlemarket://oauth?accessToken=…&refreshToken=…
 *   실패  cuddlemarket://oauth?error=…
 *
 * ⚠️ 토큰이 하나만 오면 못 쓴다. 리프레시 토큰이 없으면 액세스 토큰이 만료됐을 때
 *    되살릴 방법이 없어, 사용자는 얼마 뒤 영문 모르고 로그아웃된다.
 *    tokens.ts의 loadTokens()도 같은 이유로 하나만 있으면 없는 것으로 친다.
 */
export function parseOAuthCallback(url: string): OAuthCallback {
  let params: URLSearchParams;
  try {
    // 커스텀 스킴도 URL이 읽는다. 못 읽는 주소면 던지므로 감싼다
    params = new URL(url).searchParams;
  } catch {
    return { kind: 'unknown' };
  }

  const error = params.get('error');
  if (error) return { kind: 'error', message: error };

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  if (accessToken && refreshToken) return { kind: 'tokens', accessToken, refreshToken };

  return { kind: 'unknown' };
}
```

- [ ] **Step 4: 초록을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/auth/social.ts mobile/lib/auth/social.test.ts
git commit -m "feat(mobile): 소셜 로그인이 돌아온 주소에서 토큰 꺼내기 (#828)"
```

- [ ] **Step 6: 리드에게 보고**

---

# Task 5: 앱 — 브라우저를 열고 로그인을 마무리한다

**Files:**
- Modify: `mobile/lib/auth/social.ts`

**Interfaces:**
- Consumes: `parseOAuthCallback`(Task 4) · `saveTokens`(`mobile/lib/auth/tokens.ts`) · `useAuthStore`(`mobile/lib/auth/store.ts`)
- Produces: `startSocialLogin(provider: SocialProvider): Promise<SocialLoginResult>` · `type SocialLoginResult = { kind: 'signedIn' } | { kind: 'canceled' } | { kind: 'failed'; message: string }`

**⚠️ 먼저 확인할 것**: `mobile/lib/auth/store.ts`를 열어 세션을 세우는 함수의 **진짜 이름과 인자**를 본다. `:38`에 `set({ status: 'authed', accessToken, refreshToken })`가 있다. 계획서가 적은 이름과 다르면 **파일 쪽이 맞다.**

또 `mobile/lib/auth/api.ts`에서 서버 주소를 어떻게 만드는지(`apiBaseUrl()` 같은 것) 확인해 그대로 쓴다. **주소를 새로 지어내지 마라.**

- [ ] **Step 1: 만든다**

`mobile/lib/auth/social.ts`에 더한다:

```ts
import * as WebBrowser from 'expo-web-browser';

/** 브라우저가 이 주소로 오면 창이 저절로 닫히고 앱으로 돌아온다 */
const REDIRECT_URL = 'cuddlemarket://oauth';

export type SocialLoginResult =
  | { kind: 'signedIn' }
  | { kind: 'canceled' }
  | { kind: 'failed'; message: string };

/**
 * 소셜 로그인을 시작한다.
 *
 * ⚠️ client=app 깃발을 꼭 붙인다. 없으면 서버가 **웹 주소로** 돌려보내서
 *    브라우저 창 안에 웹 화면이 뜬 채 앱으로 못 돌아온다.
 * ⚠️ 커스텀 스킴은 Expo Go에서 안 돈다. 개발 빌드로만 끝까지 확인된다.
 */
export async function startSocialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
  const authUrl = `${oauthBaseUrl()}/oauth2/authorization/${provider}?client=app`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URL);

  // 사용자가 스스로 닫았다. 아무 말도 하지 않는다 — 자기가 그만둔 것을 알고 있다
  if (result.type !== 'success') return { kind: 'canceled' };

  const parsed = parseOAuthCallback(result.url);

  if (parsed.kind === 'error') return { kind: 'failed', message: parsed.message };
  if (parsed.kind === 'unknown') {
    return { kind: 'failed', message: '로그인에 실패했습니다. 다시 시도해주세요.' };
  }

  await saveTokens({ accessToken: parsed.accessToken, refreshToken: parsed.refreshToken });
  useAuthStore.getState().setSession(parsed.accessToken, parsed.refreshToken);

  return { kind: 'signedIn' };
}
```

⚠️ `setSession`은 **가짜 이름이다.** store.ts를 열어 실제 이름으로 바꿔라(`:38` 근처).

⚠️ `oauthBaseUrl()`도 마찬가지다. `api.ts`의 주소 만드는 함수는 `/api`까지 붙어 있을 수 있는데, `/oauth2/authorization/...`는 **`/api` 없이** 붙는 경로다(웹 `SocialLoginButtons.tsx`가 `https://cmarket-api.duckdns.org/oauth2/authorization/${provider}`로 부른다). `/api`가 붙어 있으면 떼는 함수를 이 파일에 짧게 만들고 이유를 주석으로 남겨라.

- [ ] **Step 2: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 3: 커밋**

```bash
git add mobile/lib/auth/social.ts
git commit -m "feat(mobile): 브라우저로 소셜 로그인 태우기 (#828)"
```

- [ ] **Step 4: 리드에게 보고**

`store.ts`·`api.ts`에서 실제로 쓴 이름을 **그대로 적어** 보고한다. 계획서와 다르면 다르다고 적는다.

---

# Task 6: 앱 — 소셜 단추와 로그인 화면

**Files:**
- Create: `mobile/components/auth/social-login-buttons.tsx`
- Modify: `mobile/app/login.tsx`

**Interfaces:**
- Consumes: `startSocialLogin`(Task 5) · `showToast`(`mobile/lib/toast.ts`)
- Produces: `<SocialLoginButtons onSignedIn={() => void} />`

**문구와 색은 웹 그대로다** (`src/features/login/components/SocialLoginButtons.tsx`):

```
카카오 간편 로그인    바탕 #FEE500
구글 간편 로그인      바탕 #F2F2F2
```

- [ ] **Step 1: 단추 조각을 만든다**

`mobile/components/auth/social-login-buttons.tsx`:

```tsx
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { startSocialLogin, type SocialProvider } from '@/lib/auth/social';
import { showToast } from '@/lib/toast';

// 웹 SocialLoginButtons.tsx와 같은 문구·같은 색·같은 차례(카카오 → 구글).

interface Props {
  /** 로그인에 성공했을 때. 보통 화면을 닫거나 추가 정보로 보낸다 */
  onSignedIn: () => void;
}

export function SocialLoginButtons({ onSignedIn }: Props) {
  // 어느 단추가 도는 중인지. 둘 다 잠가야 브라우저가 두 번 열리지 않는다
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const press = async (provider: SocialProvider) => {
    if (busy) return;

    setBusy(provider);
    try {
      const result = await startSocialLogin(provider);

      // 사용자가 스스로 닫았으면 아무 말도 하지 않는다
      if (result.kind === 'canceled') return;
      if (result.kind === 'failed') {
        showToast(result.message);
        return;
      }
      onSignedIn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.group}>
      <Pressable
        onPress={() => void press('kakao')}
        disabled={busy !== null}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.kakao, pressed && styles.pressed]}
      >
        {busy === 'kakao' ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <Text style={styles.kakaoLabel}>카카오 간편 로그인</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => void press('google')}
        disabled={busy !== null}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.google, pressed && styles.pressed]}
      >
        {busy === 'google' ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <Text style={styles.googleLabel}>구글 간편 로그인</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  button: {
    height: 48, // 이메일 로그인 단추와 같은 높이 — 셋이 나란히 서면 높이가 맞아야 한다
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  // 웹과 같은 값(SocialLoginButtons.tsx의 bg-[#fee500] · bg-[#F2F2F2])
  kakao: { backgroundColor: '#FEE500' },
  google: { backgroundColor: '#F2F2F2' },
  kakaoLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  googleLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
});
```

⚠️ **아이콘은 이번에 넣지 않는다.** 웹은 `/images/kakao.svg`를 쓰는데 앱에는 그 파일이 없고, SVG를 앱에서 그리려면 꾸러미가 하나 더 든다. 문구만으로도 어느 단추인지 분명하다. 넣고 싶으면 리드에게 물어라.

- [ ] **Step 2: 로그인 화면에 붙인다**

`mobile/app/login.tsx` — `<LoginForm onSuccess={close} />` **아래**, 회원가입 링크 **위**에 넣는다:

```tsx
<SocialLoginButtons onSignedIn={close} />
```

웹도 폼 아래 같은 자리에 둔다.

⚠️ 지금은 성공하면 그냥 화면을 닫는다. **추가 정보로 보내는 것은 Task 9에서** 이어 붙인다 — 그 화면이 아직 없기 때문이다.

- [ ] **Step 3: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 4: 커밋**

```bash
git add mobile/components/auth/social-login-buttons.tsx mobile/app/login.tsx
git commit -m "feat(mobile): 로그인 화면에 카카오·구글 단추 (#828)"
```

- [ ] **Step 5: 리드에게 보고**

⚠️ **Expo Go에서는 여기까지 눌러도 앱으로 안 돌아온다.** 브라우저가 열리는 것까지만 보인다. 그게 정상이라고 함께 적는다.

---

# Task 7: 앱 — 생년월일 칸을 가입 폼 훅에서 떼어낸다

**Files:**
- Modify: `mobile/components/signup/birth-date-field.tsx`
- Modify: `mobile/app/signup.tsx:209` (부르는 자리)

**Interfaces:**
- Consumes: `FieldLabel`(`mobile/components/ui/field-label.tsx`)
- Produces: `<BirthDateField year gugun… />` — 아래 새 Props

**지금 무엇에 묶여 있나** (`birth-date-field.tsx:10-13`):

```tsx
interface Props {
  form: ReturnType<typeof useSignupForm>;
  onFocus?: TextInputProps['onFocus'];
}
```

가입 폼 훅을 통째로 받는다. 추가 정보 화면은 이메일·비밀번호가 없어 그 훅을 쓸 수 없다. **11바퀴에 `RegionField`에 한 것과 같은 떼어내기다.**

**⚠️ 함께 고칠 것**: 이 조각은 자기 이름표를 따로 들고 있어(`:68` `label: { fontSize: 13, color: '#6B7280' }`) 11바퀴의 이름표 통일에서 빠졌다. 지금 가입 화면에서 **「생년월일」만 작고 흐리다.** `FieldLabel`로 바꾼다.

- [ ] **Step 1: 값만 주고받게 바꾼다**

```tsx
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FieldLabel } from '@/components/ui/field-label';

import { messageStyles } from './field';

// 생년월일. 웹과 같이 YYYY / MM / DD 세 칸으로 받는다(BirthDateField.tsx:74,87,100).
//
// 가입 화면과 「추가 정보 입력」 화면이 같이 쓴다. 그래서 폼 훅에 묶지 않고 값만 주고받는다
// (11바퀴에 RegionField에 한 것과 같다).

interface Props {
  year: string;
  month: string;
  day: string;
  /** 세 칸을 하나로 보므로 오류도 하나다 */
  error?: string;
  onChange: (part: 'year' | 'month' | 'day', value: string) => void;
  onFocus?: TextInputProps['onFocus'];
  /** 필수 칸이면 이름표 뒤에 빨간 별표 */
  required?: boolean;
}

/** 숫자만 남기고 자리수를 자른다. 웹 BirthDateField와 같은 방식이다. */
function digits(text: string, max: number): string {
  return text.replace(/[^0-9]/g, '').slice(0, max);
}

export function BirthDateField({ year, month, day, error, onChange, onFocus, required }: Props) {
  return (
    <View style={styles.field}>
      <FieldLabel text="생년월일" required={required} />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.year, error ? styles.inputError : null]}
          value={year}
          onChangeText={(text) => onChange('year', digits(text, 4))}
          onFocus={onFocus}
          placeholder="YYYY"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={4}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={month}
          onChangeText={(text) => onChange('month', digits(text, 2))}
          onFocus={onFocus}
          placeholder="MM"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={day}
          onChangeText={(text) => onChange('day', digits(text, 2))}
          onFocus={onFocus}
          placeholder="DD"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
    </View>
  );
}
```

`styles`에서 `label:` 줄을 지우고 주석을 남긴다:

```tsx
  // 이름표 모양은 ui/field-label.tsx가 들고 있다
```

- [ ] **Step 2: 가입 화면이 값을 넘기게 한다**

`mobile/app/signup.tsx`의 `<BirthDateField form={form} onFocus={focusField('birthDate')} />`를 바꾼다:

```tsx
<BirthDateField
  year={form.values.birthYear}
  month={form.values.birthMonth}
  day={form.values.birthDay}
  error={form.errors.birthYear}
  onChange={(part, value) =>
    form.setValue(
      part === 'year' ? 'birthYear' : part === 'month' ? 'birthMonth' : 'birthDay',
      value
    )
  }
  onFocus={focusField('birthDate')}
/>
```

⚠️ 오류는 `errors.birthYear` 자리에 모여 있다(옛 코드 `:23`에 그렇게 적혀 있다). 바꾸지 마라.

- [ ] **Step 3: 가입 시험이 안 깨졌는지 본다**

```bash
pnpm gate:mobile
```

`mobile/lib/signup/use-signup-form.test.ts`가 돈다. 훅은 안 건드렸으니 그대로 통과해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add mobile/components/signup/birth-date-field.tsx mobile/app/signup.tsx
git commit -m "refactor(mobile): 생년월일 칸을 가입 폼 훅에서 떼어냄 (#828)"
```

- [ ] **Step 5: 리드에게 보고**

⚠️ **가입 화면을 눈으로 봐야 한다** — 「생년월일」 이름표가 다른 칸과 같은 굵기·색이 됐는지, 세 칸이 그대로 도는지.

---

# Task 8: 앱 — 프로필에 생년월일을 더하고 고칠 수 있게

**Files:**
- Modify: `mobile/lib/profile.ts`

**Interfaces:**
- Consumes: `apiFetch`(`mobile/lib/auth/api.ts`)
- Produces: `MyProfile`에 `birthDate: string | null` 추가 · `updateMe(input: UpdateMeInput): Promise<void>` · `interface UpdateMeInput { nickname: string; birthDate: string; addressSido: string; addressGugun: string }`

**왜 필요한가**: `needsSocialSignup`이 `birthDate`를 보는데 앱 `MyProfile`에는 그 필드가 없다(지금은 id·nickname·profileImageUrl·addressSido·addressGugun 다섯뿐). 그리고 추가 정보를 저장할 길이 없다 — `fetchMe()`만 있다.

**⚠️ 서버 응답을 직접 확인하라.** 실측한 `GET /profile/me`는 이렇게 온다:

```json
{ "code": "SUCCESS", "message": "성공", "data": {
  "id": 4, "profileImageUrl": null, "userRole": "USER", "provider": "KAKAO",
  "addressSido": "서울특별시", "addressGugun": "강남구", "nickname": "테스트중2",
  "createdAt": "...", "introduction": null, "name": "주현",
  "birthDate": "1988-04-03", "email": "kakao_4692811908@kakao.local",
  "isBlocked": null, "isReported": null } }
```

저장은 웹이 `PATCH /profile/me`를 쓴다(`SocialSignUpForm.tsx:91` `api.patch('/profile/me', requestData)`). 보내는 값도 그 파일에서 그대로 가져와라(`nickname` · `birthDate` · `addressSido` · `addressGugun`).

- [ ] **Step 1: 시험을 먼저 쓴다**

`mobile/lib/profile.test.ts`:

```ts
// apiFetch가 SecureStore를 타는데 네이티브 모듈이라 jest에서 못 돈다.
// products.test.ts가 같은 이유로 같은 mock을 쓴다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchMe, updateMe } from './profile';

const mockFetch = jest.fn();

/** 요청에 실린 두 번째 인자(method·body 등)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
});

// 실측한 서버 응답 모양 그대로다(GET /profile/me).
const ME = {
  id: 4,
  nickname: '테스트중2',
  profileImageUrl: null,
  addressSido: '서울특별시',
  addressGugun: '강남구',
  birthDate: '1988-04-03',
};

describe('fetchMe', () => {
  it('생년월일까지 담아서 준다 — needsSocialSignup이 이 값을 본다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await expect(fetchMe()).resolves.toMatchObject({ birthDate: '1988-04-03' });
  });
});

describe('updateMe', () => {
  it('PATCH로 네 값을 보낸다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await updateMe({
      nickname: '주현',
      birthDate: '1988-04-03',
      addressSido: '서울특별시',
      addressGugun: '강남구',
    });

    const init = initOf(mockFetch.mock.calls[0]);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body ?? '{}')).toEqual({
      nickname: '주현',
      birthDate: '1988-04-03',
      addressSido: '서울특별시',
      addressGugun: '강남구',
    });
  });

  it('서버가 막으면 던진다 — 화면이 「저장됐다」고 하면 안 된다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await expect(
      updateMe({ nickname: 'ㄱ', birthDate: '1988-04-03', addressSido: '서울특별시', addressGugun: '강남구' })
    ).rejects.toThrow();
  });
});
```

⚠️ `mockFetch.mock.calls[0]`이 첫 요청이다. `apiFetch`가 토큰이 없을 때 갱신을 한 번 더 부를 수 있으니, 위처럼 **로그인 상태를 미리 세워** 두고 첫 호출만 본다.

- [ ] **Step 2: 빨간 것을 확인한다**

```bash
pnpm --filter ./mobile exec jest lib/profile.test.ts
```

- [ ] **Step 3: 만든다**

`MyProfile`에 한 줄 더한다:

```ts
  /** 소셜로 처음 들어오면 null이다. needsSocialSignup이 이 값을 본다 */
  birthDate: string | null;
```

그리고 저장 함수를 더한다:

```ts
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
```

- [ ] **Step 4: 초록을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/profile.ts mobile/lib/profile.test.ts
git commit -m "feat(mobile): 내 프로필에 생년월일 · 프로필 수정 API (#828)"
```

- [ ] **Step 6: 리드에게 보고**

---

# Task 9: 앱 — 「추가 정보 입력」 화면

**Files:**
- Create: `mobile/app/social-signup.tsx`
- Modify: `mobile/app/_layout.tsx` (루트 스택에 등록)
- Modify: `mobile/components/auth/social-login-buttons.tsx` (성공 뒤 판정)

**Interfaces:**
- Consumes: `needsSocialSignup`(Task 1) · `BirthDateField`(Task 7) · `updateMe`·`fetchMe`(Task 8) · `Field`·`fieldStyles`(`mobile/components/signup/field.tsx`) · `RegionField`(`mobile/components/products/region-field.tsx`) · `checkNicknameAvailable`(`mobile/lib/signup/api.ts:78`)
- Produces: 없음 (마지막 화면)

**문구는 웹 그대로**: 제목 「추가 정보 입력」 · 설명 「서비스 이용을 위해 아래 정보가 필요합니다」.

- [ ] **Step 1: 성공 뒤 어디로 갈지 정하는 자리를 만든다**

`social-login-buttons.tsx`의 `onSignedIn` 앞에 판정을 넣지 **말고**, 판정은 화면 쪽(`app/login.tsx`)에서 한다 — 단추 조각은 로그인만 알고 화면 이동은 화면이 정하는 편이 낫다.

`mobile/app/login.tsx`:

```tsx
const handleSocialSignedIn = async () => {
  try {
    const me = await fetchMe();
    if (needsSocialSignup(me)) {
      router.replace('/social-signup');
      return;
    }
  } catch {
    // 프로필을 못 읽어도 **로그인은 이미 됐다.** 여기서 로그아웃시키면
    // 방금 성공한 로그인을 되돌리는 셈이다. 그냥 닫고 알린다.
    showToast('내 정보를 불러오지 못했어요. 마이에서 다시 확인해주세요.');
  }
  close();
};
```

`<SocialLoginButtons onSignedIn={() => void handleSocialSignedIn()} />`

- [ ] **Step 2: 화면을 만든다**

`mobile/app/social-signup.tsx`. 다음을 지킨다:

```
헤더        뒤로가기 없음 — 이 화면은 건너뛸 수 없다(설계 §4-3).
            안드로이드 하드웨어 뒤로가기도 막는다:
            BackHandler.addEventListener('hardwareBackPress', () => true)
            (app/signup.tsx:62-67이 같은 방식을 쓴다 — 그대로 따라 한다)
칸 셋       닉네임(중복체크 단추 포함) · 생년월일 · 거주지
처음 값     닉네임은 서버가 만들어 준 것으로 채운다(fetchMe의 nickname)
저장        updateMe({ nickname, birthDate: `${y}-${mm}-${dd}`, addressSido, addressGugun })
            성공하면 router.replace('/(tabs)/(home)')
키보드      app/signup.tsx와 같이 KeyboardAvoidingView + ScrollView로 감싼다
```

⚠️ **생년월일을 서버가 받는 모양으로 맞춰라.** 실측 응답이 `"1988-04-03"`이므로 `YYYY-MM-DD`다. 월·일이 한 자리면 앞에 0을 채운다. 이건 조용히 틀리는 자리라 **순수 함수로 떼서 시험을 붙인다.**

`mobile/lib/signup/validation.ts`에 더한다:

```ts
/**
 * 세 칸을 서버가 받는 모양(YYYY-MM-DD)으로 합친다.
 *
 * ⚠️ 0을 안 채우면 「1988-4-3」이 되어 서버가 못 읽거나 엉뚱한 날로 저장된다.
 *    화면에서는 멀쩡해 보이고 저장도 성공한 것처럼 보이는, 조용한 종류의 오류다.
 */
export function toBirthDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```

`mobile/lib/signup/validation.test.ts`에 더한다:

```ts
describe('toBirthDate', () => {
  it('한 자리 월·일에 0을 채운다', () => {
    expect(toBirthDate('1988', '4', '3')).toBe('1988-04-03');
  });

  it('두 자리는 그대로 둔다', () => {
    expect(toBirthDate('1988', '12', '25')).toBe('1988-12-25');
  });

  it('서버가 준 모양과 같다 — GET /profile/me가 "1988-04-03"으로 준다', () => {
    expect(toBirthDate('1988', '04', '03')).toBe('1988-04-03');
  });
});
```

⚠️ 시험을 **먼저** 쓰고 빨간 것을 본 뒤 만든다. `import`에 `toBirthDate`를 더하는 것도 잊지 마라.

⚠️ **유효성은 가입 화면 규칙을 그대로 쓴다.** `mobile/lib/signup/validation.ts`에 `validateNickname`·`validateBirthDate`가 이미 있다. **새로 짓지 마라** — 열어서 시그니처를 확인하고 그대로 부른다.

- [ ] **Step 3: 루트 스택에 등록한다**

`mobile/app/_layout.tsx`에 한 줄 더한다(`products/[id]/edit` 옆):

```tsx
<Stack.Screen name="social-signup" options={{ headerShown: false }} />
```

- [ ] **Step 4: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 리드에게 보고**

무엇을 재사용했고 무엇을 새로 썼는지 적는다. 특히 `validation.ts`의 함수 이름을 실제로 확인했는지.

---

# Task 10: 개발 빌드 만들기

**Files:**
- Modify: `mobile/eas.json`

**Interfaces:**
- Consumes: 없음
- Produces: 폰에 깔 개발용 APK

**왜 필요한가**: 커스텀 스킴(`cuddlemarket://`)은 **Expo Go가 모른다.** 지금까지 만든 것은 브라우저가 열리는 데까지만 보인다. 개발 빌드를 한 번 만들면 그 뒤로는 Expo Go처럼 JS만 새로고침되면서 스킴도 돈다.

- [ ] **Step 1: 꾸러미를 넣는다**

```bash
cd mobile && npx expo install expo-dev-client
```

⚠️ `npm install`이나 `@latest`를 쓰지 마라. `npx expo install`이 SDK 54에 맞는 판을 고른다.

- [ ] **Step 2: eas.json에 프로필을 더한다**

`build` 안, `preview` 위에 넣는다:

```json
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
```

- [ ] **Step 3: 빌드 (리드·사용자)**

```bash
cd mobile && eas build --profile development --platform android
```

10~20분 걸린다. 끝나면 나오는 주소로 폰에서 APK를 받아 깐다.

- [ ] **Step 4: 붙여 본다**

```bash
cd mobile && pnpm expo start --dev-client
```

폰의 **개발 빌드 앱**(Expo Go가 아니다)으로 열어 화면이 뜨는지 본다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/eas.json mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): 개발 빌드 프로필 — 커스텀 스킴은 Expo Go에서 안 돈다 (#828)"
```

---

# Task 11: 실기기 확인 (사용자) + PR

**Files:** 없음 (확인만)

- [ ] **Step 1: 서버를 배포한다 (리드)**

Task 3의 변경은 배포해야 돈다. 배포 전에는 앱이 늘 웹으로 튕긴다.

- [ ] **Step 2: 설계 §9의 완료 기준을 하나씩 본다**

**게이트가 절대 못 잡는 것부터** 본다.

```
□ 카카오 단추 → 브라우저가 열린다
□ 로그인·동의 뒤 **브라우저가 저절로 닫히고 앱으로 돌아온다**   ← 이번 바퀴의 알맹이
□ 처음이면 「추가 정보 입력」이 뜬다 · 뒤로가기로 못 빠져나간다
□ 채워서 저장하면 홈으로 간다
□ 앱을 껐다 켜도 로그인이 유지된다 (토큰이 SecureStore에 들어갔나)
□ 다시 로그인하면 추가 정보 화면을 건너뛴다
□ 구글도 같은 흐름으로 된다
□ 도중에 브라우저를 닫으면 조용히 로그인 화면에 머문다
□ 소셜로 로그인한 뒤 찜·상품 등록이 된다
□ 카카오 동의 화면에 「카카오계정(이메일)」이 뜬다        ← scope 고침 확인
□ 이메일로 가입한 계정과 **같은 이메일**로 카카오 로그인하면 그 계정에 붙는다
□ 웹 소셜 로그인이 예전 그대로 된다                      ← 서버를 건드렸다. 회귀
□ 가입 화면 「생년월일」 이름표가 다른 칸과 같다            ← Task 7 회귀
```

- [ ] **Step 3: 게이트 전부**

```bash
pnpm gate:all
```

- [ ] **Step 4: 스펙에 실기기 결과를 적는다**

`docs/superpowers/specs/2026-08-03-app-social-login-design.md`에 §12를 더해 드러난 것을 남긴다. 없으면 「확인 완료」만 적는다.

- [ ] **Step 5: PR**

`/commit-push`로 만든다. **base는 `develop`이다.** 본문에 `- Close #828`을 넣는다.

- [ ] **Step 6: 플레이 콘솔**

「데이터 보안 → 계정 생성 방법」에 **OAuth**를 더한다. 지금은 「사용자 이름 및 비밀번호」만 있다.

---

## 나중에 할 것 (이슈로 남긴다)

```
1.1    카카오·구글 둘 다 네이티브 SDK로 — 비밀번호를 안 치게 되고 토큰이 주소에 안 실린다
그 뒤   기존 카카오 계정의 가짜 이메일(kakao_…@kakao.local) 정리
        부딪히는 계정을 어떻게 다룰지 정한 뒤에 한다
검토    소셜 단추에 카카오·구글 아이콘 (지금은 문구만. SVG를 그리려면 꾸러미가 하나 더 든다)
```
