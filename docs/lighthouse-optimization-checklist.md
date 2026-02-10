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

<!-- 이후 최적화 항목은 아래에 추가 -->
