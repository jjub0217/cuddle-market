# Google Search Console을 활용한 SEO 개선 과정

## 배경

커들마켓을 Google에 검색했을 때, meta description 대신 필터 UI 텍스트(사료/간식, 포유류, 조류 등)가 검색 결과 snippet으로 노출되는 문제를 발견했다.

**기대한 snippet:**
> 반려동물 용품을 사고팔 수 있는 따뜻한 중고거래 플랫폼, 커들마켓

**실제 snippet:**
> 포유류 조류 파충류 수생동물 곤충/절지동물 기타 사료/간식 장난감 사육장/하우스 ...

---

## 1단계: 원인 분석

### 원인
홈 페이지의 필터 버튼 텍스트가 SSR(Server-Side Rendering) HTML에 그대로 렌더링되어 Google 크롤러가 이를 페이지의 주요 콘텐츠로 인식했다.

### 해결 방법
Google의 `data-nosnippet` 속성을 사용하여 필터 영역의 텍스트를 검색 결과 snippet 후보에서 제외했다.

```tsx
// 필터 section에 data-nosnippet 추가
<section aria-label="상품 필터" className="flex flex-col gap-7" data-nosnippet>

// 상품 타입 Tabs를 data-nosnippet div로 감싸기
<div data-nosnippet>
  <Tabs ... />
</div>
```

- `data-nosnippet`은 Google이 공식 지원하는 HTML 속성
- 해당 요소의 텍스트를 검색 snippet 후보에서 제외
- 시각적 표시와 접근성에는 영향 없음

---

## 2단계: Google Search Console - URL 검사

배포 후 `data-nosnippet`이 정상 적용되었는지 확인하는 과정.

### 2-1. URL 검사 진입

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 상단 검색창에 확인할 URL 입력 (예: `https://cuddle-market.vercel.app/`)
3. Enter

### 2-2. 실시간 테스트

URL 검사 결과 화면에서:

1. 우측 상단 **"실제 URL 테스트"** (또는 "라이브 URL 테스트") 클릭
2. Google이 현재 시점의 페이지를 실제로 크롤링
3. 결과 확인:
   - **"URL을 Google에 등록할 수 있음"** - 정상
   - **"페이지 가져오기: 성공"** - Google이 페이지에 접근 가능

### 2-3. 렌더링된 HTML 확인

실시간 테스트 결과에서:

1. **"테스트된 페이지 보기"** 클릭
2. **"HTML"** 탭 선택
3. `Ctrl+F`로 `data-nosnippet` 검색
4. 필터 영역에 속성이 적용되었는지 확인

> 또는 브라우저에서 직접 확인:
> 1. 해당 URL 접속
> 2. 우클릭 > **"페이지 소스 보기"** (`Ctrl+U`)
> 3. `Ctrl+F`로 `data-nosnippet` 검색

---

## 3단계: 색인 생성 요청

페이지 변경사항을 Google에 빠르게 반영하기 위한 재크롤링 요청.

1. Google Search Console 상단 검색창에 URL 입력 후 Enter
2. **"색인 생성 요청"** 클릭 (우측 "페이지가 변경되었나요?" 옆)
3. 확인 팝업에서 **확인** 클릭
4. "색인 생성이 요청되었습니다" 메시지 확인

> 색인 요청 후 실제 반영까지 수일 소요될 수 있다.

---

## 4단계: 사이트맵 제출

### 사이트맵이란?
웹사이트의 모든 페이지 URL을 XML 형식으로 정리한 파일. Google 크롤러가 사이트 구조를 파악하는 데 도움을 준다.

### Next.js에서 사이트맵 생성

`src/app/sitemap.ts` 파일을 생성하면 Next.js가 자동으로 `/sitemap.xml` 경로에 사이트맵을 생성한다.

```ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: 'https://cuddle-market.vercel.app',
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // ... 추가 페이지
  ]
}
```

### Google Search Console에 사이트맵 제출

1. 좌측 메뉴에서 **"사이트맵"** 클릭
2. "새 사이트맵 추가" 입력란에 `sitemap.xml` 입력
3. **"제출"** 클릭
4. "제출된 사이트맵" 목록에서 상태 확인
   - **"성공"** - 정상
   - **"가져올 수 없음"** - Google이 사이트맵에 접근하지 못함 (아래 트러블슈팅 참고)

---

## 트러블슈팅: 사이트맵 "가져올 수 없음" 문제

### 증상
사이트맵을 제출했으나 상태가 계속 **"가져올 수 없음"**으로 표시됨.

### 확인한 것들
- `https://cuddle-market.vercel.app/sitemap.xml` 브라우저 직접 접근 - **정상** (58개 URL 포함)
- `robots.txt`에 사이트맵 경로 명시 - **정상**
- sitemap.xml XML 구조 - **유효함**

### 원인: Vercel Deployment Protection

**Vercel Dashboard > Settings > Deployment Protection** 에서 확인:

- **Vercel Authentication: Enabled**
- **Standard Protection** = "Protect all except production **Custom Domains**"

`cuddle-market.vercel.app`은 Vercel 기본 도메인(Custom Domain이 아님)이므로, **Standard Protection 하에서 인증이 적용**되어 Googlebot이 접근할 수 없었다.

### 해결

**Vercel Authentication 토글을 Off**로 변경 후 Save.

이후 Google Search Console에서:
1. URL 검사 > `https://cuddle-market.vercel.app/sitemap.xml` > 실제 URL 테스트
2. **"페이지 가져오기: 성공"** 확인
3. 사이트맵 재제출

> 사이트맵 상태가 "성공"으로 바뀌는 데는 시간이 걸릴 수 있다. 실제 URL 테스트에서 "성공"이면 Google이 접근 가능한 상태이므로 기다리면 된다.

### 참고: Vercel Deployment Protection 옵션

| 옵션 | 설명 |
|------|------|
| **Standard Protection** | Custom Domain을 제외한 모든 배포에 인증 적용. `*.vercel.app` 도메인은 보호됨 |
| **All Deployments** | 모든 도메인에 인증 적용 (Pro 플랜 필요) |
| **Off** | 인증 비활성화, 모든 도메인 공개 |

Custom Domain이 없다면 **Off**로 설정해야 Googlebot이 접근 가능하다.

---

## 요약

| 단계 | 작업 | 목적 |
|------|------|------|
| 1 | `data-nosnippet` 속성 추가 | 필터 텍스트를 snippet에서 제외 |
| 2 | URL 검사 > 실시간 테스트 | 배포 반영 및 HTML 확인 |
| 3 | 색인 생성 요청 | Google 재크롤링 요청 |
| 4 | 사이트맵 제출 | 사이트 구조 전달 |
| - | Vercel Authentication Off | Googlebot 접근 허용 |

---

## 참고 자료

- [Google data-nosnippet 공식 문서](https://developers.google.com/search/docs/appearance/snippet?hl=ko#data-nosnippet)
- [Google Search Console 도움말](https://support.google.com/webmasters/answer/9012289?hl=ko)
- [Next.js Metadata - Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Vercel Deployment Protection 문서](https://vercel.com/docs/security/deployment-protection)
