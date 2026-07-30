# 앱 출시 갈래 뚫기 구현 계획 (안드로이드 1.0)

> **작업자에게:** 이 계획은 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`로 한 과제씩 실행한다. 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 커들마켓 앱을 "스토어에 올릴 수 있는 물건"으로 만들고, 비공개 테스트 트랙에 올려 **테스터 12명 × 14일 시계를 시작**한다.

**접근:** 기능을 늘리지 않는다. 앱의 정체성(이름·식별자·아이콘)을 실제 서비스 값으로 바꾸고, EAS Build로 독립 설치되는 앱을 만들고, 출시에 법으로 필요한 것(개인정보처리방침)을 갖춘다. 방침과 코드가 어긋나는 곳은 코드를 고쳐 맞춘다.

**기술 스택:** Expo SDK 54 (RN 0.81 · React 19.1) · EAS Build (eas-cli 21.4.0) · Next.js(웹) · Spring Boot(백엔드, 별도 저장소)

**설계 스펙:** `docs/superpowers/specs/2026-07-30-app-release-track-design.md`
**이슈:** #796 · **브랜치:** `feature/796--app-release-track`

---

## Global Constraints

모든 과제에 공통으로 적용된다.

- **Expo SDK 54 고정.** `mobile/package.json`의 `expo: ~54.0.35`를 올리지 않는다. 사용자의 Expo Go가 54.0.8이라 다른 버전은 실기기에서 안 돈다.
- **Expo 문서는 반드시 v54 버전 문서로 확인한다** — https://docs.expo.dev/versions/v54.0.0/ (`mobile/AGENTS.md`의 지시. Expo는 버전마다 API가 달라진다)
- **`android.package`는 `com.cuddlemarket.app`.** Play Console에 처음 올린 뒤에는 영영 못 바꾼다.
- **앱 이름은 한글 「커들마켓」.** 웹이 그렇게 부른다(`src/app/layout.tsx:14`).
- **브랜드 색은 `#FF6F0F`**, 배경 흰색 `#ffffff` (웹 `public/manifest.json`).
- **앱 안쪽 색(`mobile/constants/theme.ts`)은 건드리지 않는다.** 이슈 #786의 범위다.
- **커밋은 한국어 제목 + "왜"를 적은 본문.** 제목 끝에 `(#796)`.
- **백엔드는 이 맥에서 컴파일할 수 없다** — JDK 11만 있고 프로젝트는 21이 필요하다. 백엔드 과제는 코드를 고쳐 푸시하고 **EC2 빌드 로그로 확인**한다 (5바퀴와 같은 방식).
- **검증 명령**

  ```bash
  cd mobile && npx tsc --noEmit && npx expo lint && npx jest   # 앱
  npx tsc --noEmit                                             # 웹 (저장소 루트)
  git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' | tr '\n' '\0' | xargs -0 npx eslint
  ```

  웹 `pnpm lint`(전체)는 아직 exit 1이 정상이다 — 이슈 #788의 잔여 10건. **변경 파일만 검사하는 위 명령**을 쓴다.

---

## File Structure

| 파일 | 책임 | 과제 |
|---|---|---|
| `mobile/app.json` | 앱 정체성 — 이름·식별자·아이콘 경로·색 | 1, 2, 3 |
| `mobile/assets/images/icon.png` | 일반 앱 아이콘 (1024×1024) | 2 |
| `mobile/assets/images/android-icon-foreground.png` | 적응형 아이콘 앞장 | 2 |
| `mobile/assets/images/splash-icon.png` | 스플래시 그림 | 2 |
| `mobile/eas.json` | 빌드 프로필 (preview=APK, production=AAB) | 3 |
| `src/app/(main)/privacy/page.tsx` | 웹 개인정보처리방침 페이지 | 6 |
| `cmarket_api` `User.java` | 탈퇴 시 개인정보 삭제 *(별도 저장소)* | 4 |
| `cmarket_api` `ProfileServiceImpl.java` | 프로필 수정 시 나이 검사 *(별도 저장소)* | 5 |

**과제 순서의 이유**: 1~3은 앱 안에서 닫히고, 4~5는 백엔드(배포까지 시간이 걸림), 6은 4~5가 끝나야 방침이 사실이 된다. 7~8은 구글 본인 확인 승인이 있어야 가능하다.

---

## Task 1: 앱 정체성 — `app.json`

**Files:**
- Modify: `mobile/app.json`

**Interfaces:**
- Produces: `android.package = "com.cuddlemarket.app"` — 과제 3의 EAS 빌드와 과제 7의 스토어 업로드가 이 값을 쓴다.

- [ ] **Step 1: 지금 값을 확인한다**

```bash
cd mobile && cat app.json
```

Expected: `"name": "mobile"`, `"slug": "mobile"`, `"scheme": "mobile"`이고 `android`에 `package`가 **없다**.

- [ ] **Step 2: `app.json`을 고친다**

`mobile/app.json`의 `expo` 객체에서 아래 네 값을 바꾸고, `android`에 `package`를 더한다. **다른 항목은 건드리지 않는다.**

```json
{
  "expo": {
    "name": "커들마켓",
    "slug": "cuddle-market",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "cuddlemarket",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.cuddlemarket.app",
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    }
  }
}
```

> 아이콘 그림과 색(`adaptiveIcon`)은 **과제 2에서** 바꾼다. 이 과제는 이름·식별자만 다룬다. 한 번에 둘을 바꾸면 문제가 생겼을 때 원인을 가리기 어렵다.

- [ ] **Step 3: 설정이 제대로 읽히는지 확인한다**

```bash
cd mobile && npx expo config --type public
```

Expected: 출력에 `"name": "커들마켓"`, `"slug": "cuddle-market"`, `"package": "com.cuddlemarket.app"`가 보인다. 오류 없이 끝난다.

- [ ] **Step 4: Expo Go에서 앱이 그대로 뜨는지 확인한다**

```bash
cd mobile && pnpm expo start
```

실기기 Expo Go로 접속해 **홈 화면이 뜨고 상품 목록이 보이는지** 확인한다.

> `scheme`을 바꿨으므로 앱을 완전히 껐다 켜야 할 수 있다. 목록이 안 뜨면 로그인 상태가 풀린 것이니 다시 로그인해 본다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/app.json
git commit -m "$(cat <<'EOF'
chore(mobile): 앱 이름·식별자를 커들마켓 값으로 (#796)

Expo 템플릿 기본값("mobile")을 실제 서비스 값으로 바꾼다.
이름을 한글 「커들마켓」으로 하는 이유는 웹이 그렇게 부르고(layout.tsx:14),
홈 화면 아이콘 밑에서 "Cuddle Market"(13자)은 잘리지만 4자는 안 잘리기 때문이다.

android.package는 Play Console에 처음 올린 뒤에는 못 바꾼다. 지금은 아직
빌드해서 폰에 깔아보는 단계라 바꿀 수 있으므로, 실물로 확인한 뒤 확정한다.

아이콘과 색은 다음 커밋에서. 한 번에 바꾸면 문제가 생겼을 때 원인을 못 가린다.
EOF
)"
```

---

## Task 2: 아이콘 · 스플래시를 웹 자산으로

**Files:**
- Modify: `mobile/assets/images/icon.png`, `android-icon-foreground.png`, `splash-icon.png`
- Delete: `mobile/assets/images/android-icon-background.png`, `android-icon-monochrome.png`
- Modify: `mobile/app.json`

**Interfaces:**
- Consumes: Task 1의 `app.json` 구조
- Produces: 아이콘 파일들 — 과제 3의 빌드가 이걸 앱에 굽는다.

- [ ] **Step 1: 재료가 있는지 확인한다**

```bash
ls -l public/android-chrome-512x512.png public/android-chrome-maskable-512x512.png
sips -g pixelWidth -g pixelHeight public/android-chrome-512x512.png
```

Expected: 두 파일 다 있고, 크기가 512×512다.

- [ ] **Step 2: 원본을 백업한다**

되돌릴 수 있게 남긴다.

```bash
cd mobile/assets/images
mkdir -p _backup-expo-template
cp icon.png android-icon-foreground.png android-icon-background.png \
   android-icon-monochrome.png splash-icon.png _backup-expo-template/
ls _backup-expo-template
```

Expected: 파일 5개가 백업 폴더에 있다.

- [ ] **Step 3: 웹 아이콘을 1024×1024로 키워 넣는다**

```bash
cd /Users/osejin/Desktop/cuddle-market
sips -z 1024 1024 public/android-chrome-512x512.png \
     --out mobile/assets/images/icon.png
sips -z 1024 1024 public/android-chrome-maskable-512x512.png \
     --out mobile/assets/images/android-icon-foreground.png
sips -z 512 512 public/android-chrome-512x512.png \
     --out mobile/assets/images/splash-icon.png
sips -g pixelWidth -g pixelHeight mobile/assets/images/icon.png
```

Expected: 마지막 명령이 `pixelWidth: 1024`, `pixelHeight: 1024`를 출력한다.

> `sips`는 맥에 기본으로 있는 그림 도구다. `-z 높이 너비`는 크기를 바꾼다.
> maskable 그림을 적응형 아이콘 앞장에 쓰는 이유: 기기가 아이콘을 동그라미·네모로 잘라내는데, maskable은 잘려도 로고가 남도록 여백을 두고 만들어진 것이다.

- [ ] **Step 4: 먼저 `app.json`의 아이콘 설정을 고친다**

**파일을 지우기 전에 설정을 먼저 고친다.** 순서를 바꾸면 설정이 없는 파일을 가리키는 순간이 생겨, 그 사이에 무엇을 실행하든 깨진다.

`android.adaptiveIcon`을 아래로 바꾼다. `backgroundImage`와 `monochromeImage` 줄은 **지운다**.

```json
      "adaptiveIcon": {
        "backgroundColor": "#FF6F0F",
        "foregroundImage": "./assets/images/android-icon-foreground.png"
      },
```

- [ ] **Step 5: 이제 안 쓰는 템플릿 그림을 지운다**

```bash
cd mobile/assets/images
rm android-icon-background.png android-icon-monochrome.png
```

배경은 그림 대신 **브랜드 색**을 쓰고, 단색 아이콘(monochrome)은 Expo 템플릿 로고가 그대로 남으면 이상하므로 뺀다. Step 2의 백업에 원본이 있다.

- [ ] **Step 6: 설정이 깨지지 않았는지 확인한다**

```bash
cd mobile && npx expo config --type public
```

Expected: 오류 없이 끝나고, 출력의 `adaptiveIcon`에 `"backgroundColor": "#FF6F0F"`가 보이며 `backgroundImage`·`monochromeImage`가 **없다**.

- [ ] **Step 7: 커밋**

```bash
git add mobile/assets/images mobile/app.json
git commit -m "$(cat <<'EOF'
chore(mobile): 아이콘·스플래시를 웹 자산으로 교체 (#796)

새로 그리지 않고 웹이 이미 가진 것을 가져온다. public/android-chrome-512는
일반 아이콘, maskable 512는 적응형 아이콘 앞장으로 쓴다 — maskable은 기기가
동그라미·네모로 잘라내도 로고가 남도록 여백을 두고 만들어진 것이다.

적응형 배경은 그림 대신 브랜드 색 #FF6F0F로 둔다(웹 manifest.json의 theme_color).
Expo 템플릿의 배경 그림과 단색 아이콘은 지웠다 — 남겨두면 우리 로고가 아닌
템플릿 그림이 기기에 따라 그대로 보인다. 원본은 _backup-expo-template/에 남겼다.

512를 1024로 키웠으므로 흐릴 수 있다. 다음 과제의 실기기 설치에서 눈으로 본다.
Expo Go는 자체 아이콘을 쓰므로 여기서는 확인할 수 없다.
EOF
)"
```

> ⚠️ **이 과제는 Expo Go로 검증할 수 없다.** Expo Go 안에서 도는 앱은 Expo Go의 아이콘을 쓴다. 아이콘은 **과제 3에서 APK를 깔아야** 보인다.

---

## Task 3: `eas.json` + 첫 preview 빌드

**Files:**
- Create: `mobile/eas.json`
- Modify: `mobile/app.json` (`eas init`이 `extra.eas.projectId`를 자동으로 넣는다)

**Interfaces:**
- Consumes: Task 1의 `android.package`, Task 2의 아이콘 파일
- Produces: preview APK — 실기기에 독립 설치되는 앱. 과제 7의 production 빌드가 같은 `eas.json`을 쓴다.

- [ ] **Step 1: Expo 계정에 로그인한다 (사용자가 직접)**

```bash
npx eas-cli login
```

> **이 단계는 사용자가 직접 실행한다.** 비밀번호를 입력해야 한다. 계정이 없으면 https://expo.dev 에서 무료로 만든다.
> 프롬프트에 `! npx eas-cli login` 을 입력하면 이 세션 안에서 실행된다.

확인:

```bash
npx eas-cli whoami
```

Expected: `Not logged in`이 아니라 계정 이름이 나온다.

- [ ] **Step 2: `eas.json`을 만든다**

`mobile/eas.json` 새 파일:

```json
{
  "cli": {
    "version": ">= 21.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

풀어 쓰면:
- `preview` — **APK**를 만든다. 폰에 직접 까는 설치 파일이다. `distribution: internal`은 "스토어를 거치지 않고 링크로 받는다"는 뜻이다.
- `production` — **AAB**를 만든다. 구글에 제출하는 재료 꾸러미다. 구글이 기기별 APK로 쪼개 배포한다.
- `appVersionSource: remote` + `autoIncrement` — 스토어에 올릴 때마다 필요한 버전 번호(`versionCode`)를 EAS가 알아서 1씩 올린다. 손으로 관리하면 잊어버려서 업로드가 거부된다.

- [ ] **Step 3: EAS 프로젝트를 연결한다**

```bash
cd mobile && npx eas-cli init
```

프로젝트 이름을 물으면 `cuddle-market`(app.json의 slug)으로 둔다.

Expected: `app.json`에 `extra.eas.projectId`가 자동으로 생긴다. 확인:

```bash
grep -A3 '"extra"' mobile/app.json
```

- [ ] **Step 4: preview APK를 빌드한다**

```bash
cd mobile && npx eas-cli build --platform android --profile preview
```

- 안드로이드 서명 키를 만들지 물으면 **EAS가 관리하도록** 둔다(`Generate new keystore`).
- 빌드는 클라우드에서 돌고 **10~20분** 걸린다. 끝나면 내려받기 링크가 나온다.

> ⚠️ **여기가 이번 과제에서 가장 막히기 쉬운 곳이다.** 이 저장소는 pnpm 워크스페이스(모노레포)라 빌드가 실패할 수 있다. 실패하면 아래를 순서대로 본다.
>
> 1. 오류 로그에서 `Cannot find module '@cuddle/shared'` 류가 나오는가 → 워크스페이스 해석 문제. 저장소 루트에 `.npmrc`의 `node-linker=hoisted`가 있는지 확인(있어야 한다)
> 2. `metro.config.js`의 `watchFolders`·`nodeModulesPaths` 설정이 그대로인지 확인
> 3. 그래도 막히면 **v54 문서의 모노레포 안내**를 확인한다 — https://docs.expo.dev/guides/monorepos/
>
> 추측으로 고치지 말고 **오류 로그의 실제 문구**를 근거로 좁힌다.

- [ ] **Step 5: 실기기에 설치해 확인한다**

APK를 폰으로 내려받아 설치한다. **Expo Go를 끄고** 확인할 것:

1. 홈 화면에 **커들마켓 아이콘**이 보인다 (Expo 템플릿 그림이 아니다)
2. 아이콘 밑 이름이 **「커들마켓」** 이고 잘리지 않는다
3. 아이콘이 **흐리지 않다** — 흐리면 과제 2의 1024 확대가 부족한 것이니 원본에서 다시 만든다
4. 앱을 켜면 스플래시가 뜨고 홈 화면이 나온다
5. **로그인이 된다** (Expo Go와 다른 앱이므로 저장된 로그인 정보가 없다. 새로 로그인해 본다)
6. 상품 목록·상세가 뜬다
7. 마이 탭의 판매 내역에서 ⋮ 를 눌러 하단 시트가 올라온다

> 이 목록은 **1~5바퀴에서 만든 것이 독립 앱에서도 그대로 도는지** 보는 것이다. Expo Go 안에서만 되고 진짜 앱에서 안 되는 문제가 여기서 드러난다.

- [ ] **Step 6: 커밋**

```bash
git add mobile/eas.json mobile/app.json
git commit -m "$(cat <<'EOF'
feat(mobile): EAS 빌드 설정 + 첫 preview APK (#796)

프로필을 둘만 둔다. preview=APK(폰에 직접 설치해 확인), production=AAB(스토어 제출).
개발용(dev client)은 만들지 않는다 — 1.0 범위 기능이 전부 Expo Go에서 개발되기
때문이다(사진 선택은 expo-image-picker가 Expo Go 지원, 채팅은 순수 WebSocket,
커뮤니티·알림은 REST). Expo Go에서 안 되는 건 푸시 알림 하나뿐이고 그건 1.1이다.

appVersionSource=remote + autoIncrement: 스토어에 올릴 때마다 versionCode를 1씩
올려야 하는데 손으로 관리하면 잊어버려 업로드가 거부된다. EAS에 맡긴다.

이 빌드로 처음 "Expo Go 없이 도는 앱"이 생겼다. 아이콘·이름은 여기서만 확인된다.
EOF
)"
```

---

## Task 4: 백엔드 — 탈퇴 시 개인정보 삭제

> **별도 저장소** `~/Desktop/cmarket_api`에서 작업한다. 이 저장소에는 커밋하지 않는다.
> 이 맥에서는 **컴파일할 수 없다** (JDK 11만 있고 프로젝트는 21 필요). 푸시 후 EC2 빌드 로그로 확인한다.

**Files:**
- Modify: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/model/User.java:129`

**Interfaces:**
- Produces: 탈퇴 시 식별 정보가 지워진 `User` — 과제 6의 개인정보처리방침 3·4장이 이걸 전제로 쓰여 있다.

- [ ] **Step 1: 지금 동작을 확인한다**

```bash
cd ~/Desktop/cmarket_api
sed -n '125,145p' service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/model/User.java
```

Expected: `softDelete`가 `deletedAt`·`withdrawalReason`·`withdrawalDetailReason`·`updatedAt`만 건드리고, **이메일·이름·닉네임 등은 그대로 둔다.**

- [ ] **Step 2: 어떤 필드를 어떻게 할지 정한다**

| 필드 | 처리 | 왜 |
|---|---|---|
| `email` | `"deleted_" + id + "@cuddlemarket.invalid"` | 그냥 비우면 **고유 제약(unique)** 때문에 두 번째 탈퇴자가 저장에 실패한다. `id`를 섞어 겹치지 않게 한다. `.invalid`는 실제로 존재할 수 없는 도메인이다 |
| `nickname` | `"탈퇴한 사용자" + id` (10자 제한 주의 → `"탈퇴" + id`) | 같은 이유로 고유 제약이 있다. `@Column(length = 10)`이므로 짧게 |
| `password`, `name`, `birthDate`, `addressSido`, `addressGugun`, `profileImageUrl`, `introduction`, `socialId` | `null` | 회원을 알아볼 수 있는 정보 |
| `deletedAt`, `withdrawalReason`, `withdrawalDetailReason` | **그대로 둔다** | `UserRepository.java:84`가 탈퇴 사유를 집계한다. 지우면 통계가 깨진다 |
| `id`, `createdAt`, `role`, `provider` | 그대로 둔다 | 게시글·상품의 작성자 연결이 끊기지 않게 |

> ⚠️ `nickname`은 `@Column(nullable = false, unique = true, length = 10)`이다. **10자를 넘으면 저장이 실패한다.** `"탈퇴" + id`는 id가 8자리여도 10자다.
> `name`은 `@Column(nullable = false, length = 10)`이라 **null을 넣을 수 없다.** `"탈퇴"` 같은 짧은 고정값으로 둔다.

- [ ] **Step 3: `User.java`의 `softDelete`를 고친다**

`service/cmarket-domain/.../domain/auth/model/User.java`의 `softDelete(WithdrawalReasonType, String)`을 아래로 바꾼다.

```java
    /**
     * 소프트 삭제 처리 (탈퇴 사유 포함)
     *
     * 개인정보 보호법 제21조에 따라 탈퇴 시 회원을 알아볼 수 있는 정보를 지운다.
     * 다만 탈퇴 사유는 남긴다 — UserRepository의 탈퇴 사유 통계가 이 값을 집계한다.
     * email·nickname은 고유 제약이 걸려 있어 null로 두면 두 번째 탈퇴자가 저장에 실패하므로,
     * id를 섞어 겹치지 않는 값으로 바꾼다.
     */
    public void softDelete(WithdrawalReasonType withdrawalReason, String withdrawalDetailReason) {
        this.deletedAt = LocalDateTime.now();
        this.withdrawalReason = withdrawalReason;
        this.withdrawalDetailReason = withdrawalDetailReason;

        // 회원을 알아볼 수 있는 정보 제거
        this.email = "deleted_" + this.id + "@cuddlemarket.invalid";
        this.nickname = "탈퇴" + this.id;   // length = 10 제한
        this.name = "탈퇴";                  // nullable = false 이므로 빈 값 대신 고정값
        this.password = null;
        this.birthDate = null;
        this.addressSido = null;
        this.addressGugun = null;
        this.profileImageUrl = null;
        this.introduction = null;
        this.socialId = null;

        this.updatedAt = LocalDateTime.now();
    }
```

- [ ] **Step 4: 사유 없는 `softDelete()`도 같게 만든다**

같은 파일에 사유 없는 `softDelete()`가 하나 더 있다. 개인정보를 안 지우면 그쪽으로 빠져나가므로 함께 고친다.

```java
    /**
     * 소프트 삭제 처리 (탈퇴 사유 없이)
     */
    public void softDelete() {
        softDelete(null, null);
    }
```

- [ ] **Step 5: 다른 호출부가 깨지지 않는지 확인한다**

```bash
cd ~/Desktop/cmarket_api
grep -rn "softDelete(" --include="*.java" ./service/ | grep -v build
```

Expected: 호출부가 `AuthServiceImpl.java:258`을 포함해 몇 개 나온다. **각 호출부가 `id`가 이미 있는(저장된) 엔티티에 대해 부르는지** 확인한다 — `id`가 `null`이면 이메일이 `deleted_null@...`이 되어 두 번째 탈퇴자와 겹친다.

`AuthServiceImpl.withdraw`는 `userRepository.findByEmail...`로 조회한 엔티티를 쓰므로 `id`가 있다. **문제없다.**

- [ ] **Step 6: 커밋 · 푸시 (별도 저장소)**

```bash
cd ~/Desktop/cmarket_api
git status                      # 현재 브랜치 확인
git add service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/model/User.java
git commit -m "$(cat <<'EOF'
fix: 탈퇴 시 개인정보를 실제로 지우도록

지금까지 softDelete는 deletedAt에 날짜만 찍고 이메일·이름·닉네임·생년월일·
프로필사진·소개글을 그대로 뒀다. 나중에 지우는 배치도 없어 탈퇴해도 개인정보가
영구히 남았다. 개인정보 보호법 제21조는 목적을 다한 개인정보를 지체 없이
파기하도록 정하고 있고, 개인정보 처리방침 작성지침도 "방침은 실제 처리 현황과
일치해야 한다"고 못 박는다. 앱 출시를 위해 방침을 공개해야 하므로 코드를 맞춘다.

탈퇴 사유는 남긴다 — UserRepository의 탈퇴 사유 통계가 이 값을 집계하므로
계정을 통째로 지우면 통계가 깨진다.

email·nickname은 고유 제약이 걸려 있어 null로 두면 두 번째 탈퇴자가 저장에
실패한다. id를 섞어 겹치지 않는 값으로 바꾼다. name은 nullable=false라
null을 넣을 수 없어 짧은 고정값으로 둔다.
EOF
)"
git push
```

- [ ] **Step 7: EC2 빌드 로그로 확인한다**

이 맥에서는 컴파일할 수 없으므로 배포 로그로 확인한다. 5바퀴와 같은 방식이다.

Expected: 빌드 성공. 실패하면 로그의 컴파일 오류 문구를 근거로 고친다.

- [ ] **Step 8: 실제로 지워지는지 확인한다 (사용자)**

배포 후 **시험용 계정으로 가입 → 탈퇴** 해보고, 관리자 화면의 탈퇴 목록에서 **이메일·닉네임이 `deleted_...`·`탈퇴...` 로 바뀌었는지** 확인한다.

> ⚠️ **기존에 이미 탈퇴한 회원의 정보는 그대로 남아 있다.** 이번 수정은 앞으로의 탈퇴에만 적용된다. 기존 데이터를 정리할지는 실제 탈퇴 회원 수를 보고 정한다 — 몇 명 안 되면 손으로, 많으면 한 번 도는 정리 작업이 필요하다.

---

## Task 5: 백엔드 — 프로필 수정 · 소셜 가입에 나이 검사

> 같은 별도 저장소. 과제 4와 이어서 하면 배포를 한 번만 하면 된다.

**Files:**
- Modify: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/profile/app/service/ProfileServiceImpl.java:71`

**Interfaces:**
- Consumes: 없음
- Produces: 만 14세 미만이 프로필에 생년월일을 넣을 수 없게 됨 — 과제 6의 방침 13장이 이걸 전제로 한다.

- [ ] **Step 1: 지금 상태를 확인한다**

```bash
cd ~/Desktop/cmarket_api
grep -rn "validateAge" --include="*.java" ./service/ | grep -v build
```

Expected: **두 줄만** 나온다 — `AuthServiceImpl.java:76`(호출)과 `:290`(정의). 즉 이메일 가입에만 검사가 있다.

```bash
sed -n '285,298p' service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/app/service/AuthServiceImpl.java
```

Expected: `validateAge`가 `Period.between(birthDate, today).getYears()`로 나이를 재고 `MINIMUM_AGE` 미만이면 예외를 던진다.

- [ ] **Step 2: `ProfileServiceImpl`에 같은 검사를 넣는다**

`updateProfile`(`:71`)의 **닉네임 중복 검증 다음**, **프로필 업데이트 앞**에 넣는다.

```java
        // 2. 닉네임 중복 검증 (본인 닉네임 제외)
        if (!user.getNickname().equals(command.getNickname()) 
                && userRepository.existsByNickname(command.getNickname())) {
            throw new NicknameAlreadyExistsException("이미 사용 중인 닉네임입니다.");
        }

        // 3. 만 14세 이상 검증
        //
        // 소셜 가입 완료(SocialSignUpForm)와 프로필 수정이 둘 다 이 API를 쓴다.
        // 이메일 가입(AuthServiceImpl.signUp)에만 검사가 있어 소셜 가입은 나이 확인 없이
        // 통과했고, 이메일 가입자도 나중에 생년월일을 바꾸면 검사를 피할 수 있었다.
        validateAge(command.getBirthDate());

        // 4. 프로필 정보 업데이트
        user.updateProfile(
```

- [ ] **Step 3: `validateAge`를 이 클래스에 더한다**

`ProfileServiceImpl` 맨 아래에 넣는다. `AuthServiceImpl`과 같은 규칙이다.

```java
    private static final int MINIMUM_AGE = 14;

    /**
     * 만 14세 이상 검증
     *
     * @param birthDate 생년월일 (null이면 검사하지 않는다 — 생년월일을 바꾸지 않는 수정)
     * @throws IllegalArgumentException 만 14세 미만일 때
     */
    private void validateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return;
        }
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        if (age < MINIMUM_AGE) {
            throw new IllegalArgumentException("만 14세 이상만 이용할 수 있습니다.");
        }
    }
```

`import` 두 줄이 필요하다. 파일 위쪽 `import` 묶음에 없으면 더한다.

```java
import java.time.LocalDate;
import java.time.Period;
```

> **`birthDate == null`이면 그냥 넘어가는 이유**: 프로필 수정에서 생년월일을 안 건드리는 경우가 있다. 그때 null이 들어오는데 여기서 예외를 던지면 **소개글만 고치려던 사람도 막힌다.** 소셜 가입 완료 화면은 생년월일을 반드시 채워 보내므로(`SocialSignUpForm.tsx:85`) 그 경로는 검사된다.
>
> ⚠️ 다만 이건 **생년월일을 아예 안 보내면 검사를 피할 수 있다**는 뜻이기도 하다. 완전히 막으려면 "소셜 가입 완료"와 "일반 프로필 수정"을 API로 나눠야 하는데, 그건 이번 범위를 넘는다. 자진신고식 나이 확인은 원래 약한 장치이고 법이 요구하는 것도 완벽한 차단이 아니라 합리적인 노력이므로, 여기까지 한다.

- [ ] **Step 4: 커밋 · 푸시**

```bash
cd ~/Desktop/cmarket_api
git add service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/profile/app/service/ProfileServiceImpl.java
git commit -m "$(cat <<'EOF'
fix: 프로필 수정·소셜 가입에도 만 14세 검사

validateAge는 백엔드 전체에서 AuthServiceImpl.signUp 한 곳에서만 불렸다.
그런데 소셜 가입 완료(SocialSignUpForm)와 프로필 수정은 둘 다 PATCH /profile/me를
쓰고 거기엔 검사가 없었다. 그래서 소셜로 가입하면 나이 확인 없이 통과했고,
이메일로 가입한 사람도 나중에 생년월일을 바꾸면 검사를 피할 수 있었다.

두 경로가 같은 API를 지나므로 여기 한 곳에 검사를 넣으면 둘 다 막힌다.

생년월일이 null이면 그냥 넘어간다. 소개글만 고치려는 사람까지 막지 않기 위해서다.
소셜 가입 완료 화면은 생년월일을 반드시 채워 보내므로 그 경로는 검사된다.
EOF
)"
git push
```

- [ ] **Step 5: EC2 빌드 로그 확인 · 손 검증 (사용자)**

배포 후 웹에서 **프로필 수정 화면에 생년월일을 만 14세 미만으로 넣어** 보고 막히는지 확인한다.

Expected: "만 14세 이상만 이용할 수 있습니다." 오류가 뜬다.

---

## Task 6: 웹 개인정보처리방침 페이지

**Files:**
- Create: `src/app/(main)/privacy/page.tsx`
- Modify: `docs/privacy-policy-draft.md` (빈칸 채우기)

**Interfaces:**
- Consumes: 과제 4·5의 백엔드 수정 — 방침의 3·4·13장이 그 동작을 전제로 쓰여 있다.
- Produces: `https://cuddle-market.vercel.app/privacy` — 과제 7의 Play Console 입력에 쓴다.

- [ ] **Step 1: 백엔드 수정이 배포됐는지 먼저 확인한다**

과제 4·5가 **배포까지 끝나야** 방침이 사실이 된다. 아직이면 이 과제를 시작하지 않는다.

- [ ] **Step 2: 초안의 빈칸을 채운다**

`docs/privacy-policy-draft.md`에서 `[[ ]]`로 표시된 곳을 채운다. 사용자에게 물어야 하는 것:

| 빈칸 | 무엇 |
|---|---|
| 11장 이메일 | Play Console에 등록한 **공개 이메일과 같은 주소** |
| 7장 CloudFront | 국외 경유를 밝힐지 여부 |
| 14장 시행일 | 실제 공개하는 날 |

그리고 3장의 경고 문구(`⚠️ 백엔드 수정이 끝나야 사실이 됩니다`)는 **지운다** — 과제 4가 끝났으므로 더는 해당하지 않는다.

- [ ] **Step 3: 페이지를 만든다**

`src/app/(main)/privacy/page.tsx` 새 파일. `(main)` 그룹에 두면 헤더·하단 내비게이션이 자동으로 붙는다(`src/app/(main)/layout.tsx`).

**옮길 내용의 출처**: `docs/privacy-policy-draft.md`의 `# 커들마켓 개인정보처리방침` 아래 본문 전체(1장~14장). 부록 A·B와 「남은 할 일」은 **옮기지 않는다** — 그건 작업용 기록이지 이용자에게 보여줄 내용이 아니다.

만들 절(section) 목록 — 초안과 같은 순서·같은 제목이다.

```
1. 개인정보의 처리 목적                     8. 개인정보의 안전성 확보조치
2. 처리하는 개인정보의 항목                  9. 개인정보 자동 수집 장치의 설치·운영 및 거부
3. 개인정보의 처리 및 보유 기간             10. 정보주체와 법정대리인의 권리·의무 및 행사방법
4. 개인정보의 파기 절차 및 방법             11. 개인정보 보호책임자
5. 개인정보의 제3자 제공                    12. 권익침해에 대한 구제방법
6. 개인정보 처리업무의 위탁                 13. 해당하지 않는 사항
7. 개인정보의 국외 이전                     14. 개인정보처리방침의 변경
```

아래는 **처음 두 절을 끝까지 쓴 것**이다. 나머지 12개 절도 **똑같은 뼈대**(`<section>` + `<h2>` + 본문)에 초안의 해당 장 내용을 넣으면 된다.

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 커들마켓',
  description: '커들마켓이 이용자의 개인정보를 어떻게 처리하는지 안내합니다.',
  alternates: {
    canonical: '/privacy',
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-on-surface mb-2 text-2xl font-bold">개인정보처리방침</h1>
      <p className="text-on-surface-variant mb-8 text-sm">시행일: 2026-00-00</p>

      <p className="text-on-surface-variant mb-10 leading-relaxed">
        커들마켓(이하 &quot;서비스&quot;)은 이용자의 개인정보를 소중히 다루며 「개인정보 보호법」을
        지킵니다. 이 방침은 서비스가 어떤 정보를 왜 모으고, 어떻게 쓰고, 언제 지우는지를 이용자가
        쉽게 알 수 있도록 만든 것입니다.
      </p>

      <section className="mb-10">
        <h2 className="text-on-surface mb-3 text-lg font-bold">1. 개인정보의 처리 목적</h2>
        <p className="text-on-surface-variant mb-3 leading-relaxed">
          서비스는 아래 목적으로만 개인정보를 처리하며, 목적이 바뀌면 미리 알리고 동의를 받습니다.
        </p>
        <ul className="text-on-surface-variant list-disc space-y-1 pl-5 leading-relaxed">
          <li>회원 관리 — 회원을 알아보고 로그인 상태를 유지하기 위해</li>
          <li>중고거래 — 상품을 사고팔고, 이용자끼리 채팅으로 연락하게 하기 위해</li>
          <li>커뮤니티 — 게시글과 댓글을 보여주기 위해</li>
          <li>이용자 보호 — 신고·차단을 처리하기 위해</li>
          <li>분쟁 대응 — 부정 이용을 막고, 분쟁이 생겼을 때 사실을 확인하기 위해</li>
        </ul>
        <p className="text-on-surface-variant mt-3 leading-relaxed">
          서비스는 처리 목적에 필요한 최소한의 개인정보만 모읍니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-on-surface mb-3 text-lg font-bold">2. 처리하는 개인정보의 항목</h2>

        <h3 className="text-on-surface mt-4 mb-2 font-bold">회원 가입 때 직접 받는 정보</h3>
        <ul className="text-on-surface-variant list-disc space-y-1 pl-5 leading-relaxed">
          <li>
            이메일로 가입 — 이메일 주소, 비밀번호, 이름, 닉네임, 생년월일(필수) / 사는 지역(선택)
          </li>
          <li>
            구글·카카오로 가입 — 이메일 주소, 이름, 닉네임, 가입 경로, 소셜 서비스 회원번호(필수)
          </li>
        </ul>
        <ul className="text-on-surface-variant mt-3 list-disc space-y-1 pl-5 leading-relaxed">
          <li>비밀번호는 되돌릴 수 없는 형태로 바꾸어 저장하며, 운영자도 원래 값을 볼 수 없습니다.</li>
          <li>사는 지역은 시/도와 구/군까지만 받습니다. 상세 주소는 받지 않습니다.</li>
          <li>구글·카카오로 가입한 경우 비밀번호와 생년월일은 받지 않습니다.</li>
        </ul>

        <h3 className="text-on-surface mt-4 mb-2 font-bold">이용자가 서비스에 올리는 정보</h3>
        <p className="text-on-surface-variant leading-relaxed">
          프로필 사진, 소개글, 상품 정보(제목·설명·가격·사진·거래 상태), 채팅 메시지와 채팅으로 보낸
          사진, 커뮤니티 게시글·댓글과 첨부 사진, 찜한 상품 목록, 신고 내용, 차단한 이용자 목록,
          탈퇴 사유
        </p>

        <h3 className="text-on-surface mt-4 mb-2 font-bold">자동으로 쌓이는 정보</h3>
        <p className="text-on-surface-variant leading-relaxed">
          가입일시, 정보 수정일시, 게시글 조회수 등 이용 기록
        </p>

        <h3 className="text-on-surface mt-4 mb-2 font-bold">앱에서 요청하는 기기 권한</h3>
        <ul className="text-on-surface-variant list-disc space-y-1 pl-5 leading-relaxed">
          <li>사진·미디어 접근 — 상품·프로필·채팅·게시글 사진을 올릴 때</li>
          <li>카메라 — 사진을 그 자리에서 찍어 올릴 때</li>
        </ul>
        <p className="text-on-surface-variant mt-3 leading-relaxed">
          권한은 필요한 순간에만 요청하며, 거부해도 서비스의 다른 기능을 쓸 수 있습니다.
        </p>
      </section>

      {/* 3장부터 14장까지 위와 같은 <section> 뼈대로 이어 쓴다 */}
    </div>
  )
}
```

**표는 `<table>`로 만들지 않는다.** 모바일 폭에서 가로로 넘친다. 초안의 표는 위 2장처럼 **`<ul>`로 풀어** 쓴다.

색 이름(`text-on-surface`, `text-on-surface-variant`)은 이 프로젝트가 쓰는 토큰이다. 다른 페이지에서 쓰는 이름과 같은지 한 번 확인한다.

- [ ] **Step 4: 타입·린트 확인**

```bash
cd /Users/osejin/Desktop/cuddle-market
npx tsc --noEmit
npx eslint src/app/\(main\)/privacy/page.tsx
```

Expected: 둘 다 오류 0.

- [ ] **Step 5: 로컬에서 눈으로 확인**

```bash
pnpm dev
```

`http://localhost:3000/privacy` 를 열어 확인:
1. 헤더·하단 내비게이션이 정상으로 붙어 있다
2. **모바일 폭(개발자 도구에서 좁게)에서 가로 스크롤이 생기지 않는다**
3. 글이 읽을 만하다 (줄 간격·글자 크기)

- [ ] **Step 6: 커밋**

```bash
git add "src/app/(main)/privacy/page.tsx" docs/privacy-policy-draft.md
git commit -m "$(cat <<'EOF'
feat(web): 개인정보처리방침 페이지 (#796)

구글 플레이는 개인정보를 수집하는 앱에 개인정보처리방침 URL을 요구한다.
커들마켓은 로그인이 있어 해당하는데 웹에 페이지가 하나도 없었다.

내용은 개인정보 보호법 제30조와 2026 개인정보 처리방침 작성지침(개인정보보호위원회)의
23개 기재사항으로 대조해 썼다. 수집 항목은 지어내지 않고 User 엔티티에서 뽑았고,
사진 저장 지역(ap-northeast-2)·추적 도구 없음도 코드로 확인한 사실이다.

앞선 커밋에서 백엔드 두 곳을 고친 것도 이 방침 때문이다 — 지침이 "방침은 실제
처리 현황과 일치해야 한다"고 못 박으므로, 방침에 맞춰 코드를 먼저 고쳤다.
EOF
)"
```

- [ ] **Step 7: 배포 확인**

develop에 머지되어 Vercel 배포가 끝나면 `https://cuddle-market.vercel.app/privacy` 가 열리는지 확인한다. **이 주소를 과제 7에서 쓴다.**

---

## Task 7: production AAB → 비공개 테스트 트랙

> ⚠️ **구글의 본인 확인이 승인되어야 시작할 수 있다.** 승인 전에는 앱을 만들 수 없다.

**Files:** 없음 (Play Console 작업)

**Interfaces:**
- Consumes: 과제 3의 `eas.json`, 과제 6의 방침 URL

- [ ] **Step 1: 본인 확인·전화번호 인증이 끝났는지 확인한다**

Play Console 홈에서 **「개발자 계정 설정 완료」 카드의 세 항목이 모두 끝났는지** 본다.

- 본인 확인 (승인됨)
- Android 휴대기기 액세스 확인
- **연락처 전화번호 인증** ← 본인 확인 뒤에야 열린다. 잊기 쉽다

- [ ] **Step 2: Play Console에서 앱을 만든다**

「앱 만들기」에서:

| 항목 | 값 |
|---|---|
| 앱 이름 | `커들마켓` |
| 기본 언어 | 한국어 |
| 앱 또는 게임 | 앱 |
| 무료 또는 유료 | **무료** ⚠️ 유료를 고르면 나중에 무료로 못 바꾼다 |

- [ ] **Step 3: production AAB를 빌드한다**

```bash
cd mobile && npx eas-cli build --platform android --profile production
```

10~20분 걸린다. 끝나면 `.aab` 파일 링크가 나온다.

- [ ] **Step 4: 비공개 테스트 트랙에 올린다**

Play Console → **테스트 → 비공개 테스트** → 새 버전 만들기 → `.aab` 업로드.

> ⚠️ **「내부 테스트」가 아니라 「비공개 테스트」다.** 내부 테스트는 12명 요건에 **안 들어간다.** 여기서 잘못 고르면 14일을 통째로 날린다.

- [ ] **Step 5: 필수 항목을 채운다**

업로드 전에 Play Console이 막는 항목들이다.

| 항목 | 내용 |
|---|---|
| 개인정보처리방침 URL | `https://cuddle-market.vercel.app/privacy` (과제 6) |
| 데이터 보안 | 아래 Step 6 |
| 콘텐츠 등급 설문 | 중고거래 앱 기준으로 답한다 |
| 광고 포함 여부 | **없음** (`gtag`·`analytics` 등 검색 0건으로 확인) |
| 타겟 사용자층 | 만 18세 이상 (또는 13세 이상 — 만 14세 미만 가입을 막으므로) |

- [ ] **Step 6: 데이터 보안 양식을 채운다**

코드에서 확인한 사실을 그대로 신고한다. **지어내지 않는다.**

| 질문 | 답 | 근거 |
|---|---|---|
| 개인정보를 수집하나 | 예 | 이메일·이름·닉네임·생년월일 등 |
| 제3자와 공유하나 | 아니요 | 위탁(AWS·Vercel)은 공유가 아니다 |
| 전송 중 암호화하나 | 예 | HTTPS |
| 이용자가 삭제를 요청할 수 있나 | 예 | 마이페이지에서 탈퇴 |
| 수집 항목 | 이메일 주소, 이름, 사용자 ID, 사진, 메시지(채팅), 앱 활동 | |
| 광고·분석 목적 수집 | 아니요 | 추적 도구 검색 0건 |

- [ ] **Step 7: 테스터 12명을 초대한다**

「테스터」 탭에서 이메일 목록을 만들어 등록하고, **참여 링크(opt-in URL)** 를 받아 12명에게 보낸다.

전달할 때 반드시 알릴 것:
1. **안드로이드 폰**이어야 한다 (아이폰은 셈에 안 들어간다)
2. 링크를 눌러 **앱을 실제로 설치**해야 1명으로 센다 (초대만 받으면 안 센다)
3. **14일 동안 지우지 말아 달라** — 중간에 12명 아래로 떨어지면 그만큼 늘어난다

- [ ] **Step 8: 시계가 도는지 확인한다**

Play Console 대시보드에서 **참여한 테스터 수**가 12명 이상으로 보이는지 확인한다. 여기서부터 14일을 센다.

---

## Task 8: 14일 뒤 — 프로덕션 액세스 신청

> 과제 7의 Step 8로부터 **14일 연속** 12명이 유지된 뒤에 한다. 그 사이 7·8·9바퀴(등록·커뮤니티·채팅)를 진행한다.

- [ ] **Step 1: 조건이 채워졌는지 확인한다**

Play Console 대시보드에서 「프로덕션 액세스 신청」이 열렸는지 본다. 안 열렸으면 참여 테스터 수가 12명 아래로 떨어진 적이 있는지 확인한다.

- [ ] **Step 2: 신청서를 작성한다**

세 부분으로 나뉜다. 테스트에서 무엇을 배웠는지, 어떻게 고쳤는지를 적는다. **테스터 피드백을 미리 모아두면 여기서 쓸 수 있다.**

- [ ] **Step 3: 심사 결과를 기다린다**

보통 7일 이내에 결과가 나온다.

---

## 마무리 검증

- [ ] **통합 게이트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit
git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' | tr '\n' '\0' | xargs -0 npx eslint
```

Expected: 앱 타입 0 · 린트 exit 0 · 테스트 전부 통과 / 웹 타입 0 · 변경 파일 eslint 오류 0

> 웹 `useFavorite.ts:19`의 `set-state-in-effect` 오류는 **develop에도 있는 #788 보류 건**이다. 이번 변경과 무관하니 고치지 않는다.

- [ ] **실기기 손 검증**

preview APK를 깐 상태에서:

1. 홈 화면 아이콘이 **커들마켓 로고**이고 흐리지 않다
2. 아이콘 밑 이름이 **「커들마켓」**
3. 앱을 켜면 스플래시 → 홈 화면
4. 로그인 · 상품 목록 · 상세 · 찜이 동작한다
5. 마이 탭의 판매 내역에서 ⋮ · 상태 변경 · 삭제 · 필터가 동작한다
6. 웹 `/privacy` 가 모바일 폭에서 가로 스크롤 없이 읽힌다

- [ ] **잔여물 검사**

```bash
grep -rn "개발용\|TODO(\|console.log" mobile/app mobile/components mobile/lib
```

Expected: 출력 없음

- [ ] **PR 생성**

base는 `develop`, 저장소 템플릿(`.github/PULL_REQUEST_TEMPLATE.md`) 형식, 본문에 `Close #796`.

---

## 이 계획이 끝나면 (다음 바퀴)

- **7바퀴**: 상품 등록 · 수정. 첫 이미지 업로드를 여기서 뚫는다 (`POST /api/images`, 최대 5장 · 장당 5MB). 커뮤니티 글쓰기가 나중에 이걸 그대로 쓴다.
- **8바퀴**: 커뮤니티 읽기 + 알림 목록. 둘 다 백엔드 완비. 마크다운 라이브러리는 필요 없다 (실서버 글 30건 확인 결과 쓰이는 문법이 이미지뿐).
- **9바퀴**: 채팅. `@stomp/stompjs`로 `wss://cmarket-api.duckdns.org/ws-stomp/websocket`에 직접 붙는다. **Origin 헤더를 직접 넣지 말 것** (넣으면 403).

자세한 근거는 설계 스펙 6장에 있다.
