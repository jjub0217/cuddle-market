# Lighthouse 최적화 체크리스트

> [lighthouse-optimization-log.md](./lighthouse-optimization-log.md)에 기록된 해결 방안들의 진행 상황을 추적합니다.

---

## 1차: Improve image delivery (이미지 압축 품질)

> 관련 섹션: [1차 분석 — 이미지 전달 최적화](./lighthouse-optimization-log.md#1차-분석--이미지-전달-최적화-2026-02-10)

- [x] 백엔드 팀에 Lambda webp quality 조정 요청 (75~80)
- [x] 적용 후 Lighthouse 재측정
- [x] "Improve image delivery" 항목 사라짐 확인
- [x] 이미지 품질 육안 검수 (열화 여부 확인)
- [ ] 결과를 lighthouse-optimization-log.md에 기록

---

## 2차: LCP request discovery (초기 HTML에 이미지 URL 포함)

> 관련 섹션: [2차 분석 — LCP request discovery](./lighthouse-optimization-log.md#2차-분석--lcp-request-discovery-2026-02-10)

- [x] `src/lib/api/server/products.ts` 생성 (서버 전용 fetch 함수)
- [x] `src/app/(main)/page.tsx` 수정 (async + 서버 fetch → Home에 initialData 전달)
- [x] `src/features/home/Home.tsx` 수정 (initialData props 수신 + useInfiniteQuery에 주입)
- [ ] 로컬에서 초기 HTML에 이미지 URL 포함 여부 확인 (페이지 소스 보기)
- [ ] Lighthouse 재측정: "Request is discoverable in initial document" ✅ 통과 확인
- [ ] 필터 적용 시 기존 동작 정상 확인 (클라이언트 fetch)
- [ ] 서버 fetch 실패 시 fallback 동작 확인
- [ ] 결과를 lighthouse-optimization-log.md에 기록

---

## 5차: `<link rel="preload">` 추가

> 관련 섹션: [5차 분석 — DebugBear LCP Load Delay](./lighthouse-optimization-log.md#5차-분석--debugbear-lcp-load-delay-2026-02-10)

- [x] `page.tsx`에 `<link rel="preload" as="image">` 추가
- [x] 첫 번째 상품 이미지 URL을 서버에서 추출하여 preload에 적용
- [x] `imageSrcSet` + `imageSizes` 속성으로 반응형 preload 구현
- [x] DebugBear 재측정 (LCP 1.3s → 1.2s, TBT 140ms → 190ms, 점수 94 → 91)

---

## 6차: TBT 분석 및 StaticHomeFallback

> 관련 섹션: [6차 분석 — TBT 증가 원인 및 StaticHomeFallback](./lighthouse-optimization-log.md#6차-분석--tbt-증가-원인-및-statichomefallback-2026-02-10)

### 번들 분석
- [x] `@next/bundle-analyzer`로 홈페이지 JS 청크 분석
- [x] TBT 주요 원인 식별 (react-dom + Next.js 런타임 ~170ms — 불가피)
- [x] react-hook-form 홈페이지 로드 원인 식별 (Turbopack 공유 청크 전략)

### Suspense bailout 원인 분석
- [x] `useSearchParams()`가 Suspense bailout을 일으키는 것 확인
- [x] 초기 HTML에 `<img>` 태그가 0개인 것 확인
- [x] `initialData` RSC 페이로드 추가가 TBT 증가의 원인임을 확인

### StaticHomeFallback 구현
- [x] `src/features/home/components/StaticHomeFallback.tsx` 생성 (서버 컴포넌트)
- [x] `Home`과 동일한 레이아웃 구조로 CLS 방지
- [x] 상품 카드에 `<img>` 태그 + `srcSet` + priority 적용
- [x] `page.tsx` Suspense fallback을 `HomeSkeleton` → `StaticHomeFallback`으로 변경
- [x] 빌드 성공 및 ISR 유지 확인 (`○ / Revalidate: 1m`)
- [x] 초기 HTML에 `<img>` 22개 포함 확인 (로고 2 + 상품 20)
- [ ] DebugBear 재측정 (배포 후)
- [ ] LCP Load Delay 감소 확인
- [ ] TBT 변화 관찰

---

<!-- 이후 최적화 항목은 아래에 추가 -->
