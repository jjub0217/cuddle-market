# 예약과 결제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 판매자가 채팅한 상대 한 명을 골라 예약하고, 그 예약자만 대화를 이어 가며 채팅방에서 토스페이먼츠 테스트 결제를 하면 판매 완료가 된다.

**Architecture:** 서버는 상품에 `reservedBuyerId` 를 저장하고, 채팅방이 열려 있는지를 (상품 상태, 예약자, 완료된 결제, 방의 구매자)로 그때그때 계산하는 순수 함수 하나로 정한다. 이 값을 채팅 보내기·새 채팅 걸기·방 목록 응답이 함께 쓴다. 결제는 서버가 주문(금액)을 먼저 저장하고, 웹이 토스 결제창을 연 뒤, 서버가 저장 금액과 대조해 토스 승인 API 를 부른다.

**Tech Stack:** Spring Boot 3.2.5 / Java 21 / JPA / JUnit5 + Mockito (서버), Next.js 16 / React 19 / Vitest + RTL / `@tosspayments/tosspayments-sdk` v2 (웹)

**Spec:** `docs/superpowers/specs/2026-11-01-reservation-payment-design.md`

## Global Constraints

- 예약자 번호는 어떤 응답 DTO 에도 넣지 않는다. 판매자 본인의 예약 상대 목록만 예외.
- 예약자가 비어 있는 `RESERVED` 는 지금과 똑같이 동작한다(채팅 막지 않음, 결제 없음).
- 결제 금액은 서버가 정한다. 확정은 "받은 금액 = 저장한 금액 = 지금 상품 가격" 일 때만.
- 서버 비밀 키가 `test_sk_` 로 시작하지 않거나 비어 있으면 결제 주소는 503.
- 비밀 값 이름: 웹 `NEXT_PUBLIC_TOSS_CLIENT_KEY`, 서버 `TOSS_SECRET_KEY` → `toss.secret-key=${TOSS_SECRET_KEY:}`. 값은 어디에도 출력하지 않는다.
- 결제 수단은 카드(`method: "CARD"`) 하나. 가격 0원이면 `canPay=false`.
- 대화 기록 한 줄 문구(그대로):
  - 예약 걸림 예약자 방 `예약됐어요. 여기서 결제할 수 있어요` / 나머지 방 `판매자가 다른 분과 예약해서 대화가 잠시 멈췄어요`
  - 예약 풀림 예약자 방 `예약이 풀렸어요` / 나머지 방 `예약이 풀려서 다시 대화할 수 있어요`
  - 결제 완료 예약자 방 `결제가 완료됐어요`
- 입력칸 자리 안내(그대로): `예약된 상품이에요` / `판매 완료된 상품이에요` / `거래가 끝난 채팅방이에요`. 결제 안내 `테스트 결제예요. 실제로 돈이 나가지 않아요`. 빈 목록 `아직 채팅한 사람이 없어요`.
- 서버 엔티티는 생성자에 `@Builder` (저장소 관례). 서버는 `~/Desktop/cmarket_api` main 에 바로 커밋, 제목 끝 `(#이슈번호)`. 웹은 작업 브랜치 → develop PR. 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 웹 파일에 `npx prettier --write` 금지. 앱(`mobile/`)은 고치지 않는다.

## Review Focus

1. **성공 페이지 새로고침**: 같은 주문으로 확정이 두 번 오면 두 번째는 토스를 다시 부르지 않고 이미 끝난 결과를 돌려준다 → Task S5 `confirm_alreadyDone_returnsSameResultWithoutCallingGateway`.
2. **결제하기 연타로 주문이 둘**: 같은 상품의 READY 주문이 둘이어도 DONE 은 하나뿐, 두 번째 확정은 거절 → Task S5 `confirm_secondOrderAfterDone_rejected`.
3. **결제창 열린 사이 예약 풀림·가격 변경**: 확정 거절, 토스 안 부름 → Task S5 `confirm_reservationCleared_rejected`, `confirm_priceChanged_rejected`.
4. **옛 방식 예약(예약자 없음)**: 모든 방 열림, `canPay=false`, 새 채팅 허용 → Task S1 `of_reservedWithoutBuyer_open`, Task S4 `createChatRoom_legacyReserved_allowed`.
5. **판매자 쪽에서 본 방**: 예약 중 B 의 C 방은 B 에게도 멈춤, B 의 A 방은 열림, B 는 어떤 방에서도 `canPay=false` → Task S1 `canPay_sellerNeverTrue`, Task S4 `sendMessage_sellerToPausedRoom_rejected`.

---

## 서버 (`~/Desktop/cmarket_api/service`)

경로 약어: `D` = `cmarket-domain/src/main/java/org/cmarket/cmarket/domain`, `W` = `cmarket/src/main/java/org/cmarket/cmarket/web`, `DT` = `cmarket-domain/src/test/java/org/cmarket/cmarket/domain`.
시험 명령: `JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew test` (저장소 뿌리에서). 끝에 `./gradlew build -x bootJar` 로 컴파일 확인.

### Task S1: 예약자 칸과 채팅방 상태 계산

**Files:**
- Modify: `D/product/model/Product.java` (필드 + 메서드. 생성자는 그대로: 새 칸은 빌더로 받지 않는다)
- Create: `D/chat/model/ChatRoomState.java`
- Test: `DT/chat/model/ChatRoomStateTest.java`

**Interfaces:**
- Produces:
  - `Product.getReservedBuyerId(): Long`, `Product.reserveFor(Long buyerId): void`(상태 RESERVED + 예약자), `Product.clearReservation(): void`(예약자 null)
  - `enum ChatRoomState { OPEN, PAUSED_RESERVED, CLOSED_SOLD, CLOSED_DONE }`
  - `static ChatRoomState ChatRoomState.of(TradeStatus status, Long reservedBuyerId, boolean paid, Long roomBuyerId)`
  - `static boolean ChatRoomState.canPay(TradeStatus status, Long reservedBuyerId, boolean paid, Long price, Long viewerId, Long roomBuyerId)`

- [ ] **Step 1: 실패하는 시험 쓰기** — 설계 6절 "채팅방이 열리는지" 표를 그대로 옮긴다.

```java
@Test void of_selling_open()                    { assertEquals(OPEN, ChatRoomState.of(SELLING, null, false, 7L)); }
@Test void of_reservedWithoutBuyer_open()       { assertEquals(OPEN, ChatRoomState.of(RESERVED, null, false, 7L)); }
@Test void of_reservedBuyersRoom_open()         { assertEquals(OPEN, ChatRoomState.of(RESERVED, 7L, false, 7L)); }
@Test void of_reservedOthersRoom_paused()       { assertEquals(PAUSED_RESERVED, ChatRoomState.of(RESERVED, 7L, false, 8L)); }
@Test void of_completedPaid_buyersRoom_done()   { assertEquals(CLOSED_DONE, ChatRoomState.of(COMPLETED, 7L, true, 7L)); }
@Test void of_completedPaid_othersRoom_sold()   { assertEquals(CLOSED_SOLD, ChatRoomState.of(COMPLETED, 7L, true, 8L)); }
@Test void of_completedUnpaid_open()            { assertEquals(OPEN, ChatRoomState.of(COMPLETED, 7L, false, 8L)); }
@Test void canPay_reservedBuyerInOwnRoom_true() { assertTrue(ChatRoomState.canPay(RESERVED, 7L, false, 50000L, 7L, 7L)); }
@Test void canPay_sellerNeverTrue()             { assertFalse(ChatRoomState.canPay(RESERVED, 7L, false, 50000L, 1L, 7L)); }
@Test void canPay_zeroPrice_false()             { assertFalse(ChatRoomState.canPay(RESERVED, 7L, false, 0L, 7L, 7L)); }
@Test void canPay_alreadyPaid_false()           { assertFalse(ChatRoomState.canPay(COMPLETED, 7L, true, 50000L, 7L, 7L)); }
@Test void canPay_legacyReserved_false()        { assertFalse(ChatRoomState.canPay(RESERVED, null, false, 50000L, 7L, 7L)); }
```

- [ ] **Step 2: 실행해서 실패 확인** — `./gradlew :service:cmarket-domain:test --tests '*ChatRoomStateTest'` → 컴파일 실패(ChatRoomState 없음).
- [ ] **Step 3: 구현** — `ChatRoomState` 의 두 정적 메서드, `Product` 에 `@Column(name = "reserved_buyer_id") private Long reservedBuyerId;` 와 두 메서드. `null` 상태(판매 요청 글)는 `OPEN`.
- [ ] **Step 4: 실행해서 통과 확인** — 같은 명령 → 12개 PASS.
- [ ] **Step 5: 커밋** — `feat: 상품에 예약자 칸을 더하고 채팅방 상태를 계산한다(#이슈)`

### Task S2: 상태 바꾸기 규칙

**Files:**
- Modify: `D/product/app/service/ProductServiceImpl.java` (`updateTradeStatus`, 288~339줄 근처), `D/exception/ErrorCode.java`
- Create: `D/payment/model/Payment.java`, `D/payment/model/PaymentStatus.java`, `D/payment/repository/PaymentRepository.java` (S5 가 채운다. 여기서는 `existsByProductIdAndStatus` 만 필요)
- Create: `D/chat/app/dto/ChatSystemNotice.java` — `record ChatSystemNotice(Long chatRoomId, String content)`
- Create: `D/chat/app/service/ChatTradeNoticeService.java`
- Test: `DT/product/app/ProductTradeStatusRuleTest.java`

**Interfaces:**
- Consumes: S1 의 `Product.clearReservation()`, `getReservedBuyerId()`
- Produces:
  - `ErrorCode.TRADE_STATUS_CHANGE_NOT_ALLOWED(400, "지금 상태에서는 바꿀 수 없습니다.")`, `ErrorCode.PAID_PRODUCT_STATUS_LOCKED(400, "결제가 끝난 상품은 상태를 바꿀 수 없습니다.")`
  - `List<ChatSystemNotice> ChatTradeNoticeService.post(Long productId, Long reservedBuyerId, String buyerText, String othersText)` — 이 상품의 방마다 SYSTEM 메시지를 저장하고(판매자를 보낸 사람으로), 참여자 `lastMessage` 를 갱신해 안 읽음으로 만든 뒤, 웹 계층이 보낼 목록을 돌려준다. 구매자를 찾는 방법: 방 참여자 중 판매자가 아닌 사람.
  - `ProductService.updateTradeStatus` 의 반환을 `TradeStatusChangeResult(ProductDto product, List<ChatSystemNotice> notices)` 로 바꾼다(호출부 `W/product/controller/ProductController.java:163-177` 와 GraphQL 은 같은 REST 를 쓰므로 웹 응답 모양은 그대로).
  - `PaymentRepository.existsByProductIdAndStatus(Long productId, PaymentStatus status): boolean`

- [ ] **Step 1: 실패하는 시험 쓰기** — 설계 6절 "상태 바꾸기 규칙"마다 하나.

```
patch_sellingToReserved_legacyAllowed_noBuyer         → 상태 RESERVED, reservedBuyerId null, notices 비어 있음
patch_reservedWithBuyerToReserved_rejected            → TRADE_STATUS_CHANGE_NOT_ALLOWED
patch_reservedWithBuyerToSelling_clearsAndNotices     → reservedBuyerId null, post(…, "예약이 풀렸어요", "예약이 풀려서 다시 대화할 수 있어요") 호출
patch_reservedWithoutBuyerToSelling_noNotices         → post 호출 없음
patch_reservedToCompleted_manualAllowed               → 상태 COMPLETED, 예약자 유지
patch_completedWithDonePaymentToSelling_rejected      → PAID_PRODUCT_STATUS_LOCKED
patch_completedWithoutPaymentToSelling_allowed        → 지금처럼 허용
patch_byNonSeller_rejected                            → 지금처럼 AuthenticationFailedException
```

- [ ] **Step 2: 실행해서 실패 확인** — `--tests '*ProductTradeStatusRuleTest'` → 컴파일 실패.
- [ ] **Step 3: 구현** — 규칙 검사를 상태 변경 앞에 둔다. 찜 알림(`PRODUCT_FAVORITE_STATUS_CHANGED`)은 그대로.
- [ ] **Step 4: 웹 계층 연결** — `ProductController` 의 PATCH 가 `result.notices()` 마다 `chatWebSocketController.sendSystemMessage(chatRoomId, content)` 를 부른다(`W/chat/controller/ChatWebSocketController.java:175`, 나가기와 같은 방식).
- [ ] **Step 5: 실행해서 통과 확인** — `./gradlew test` 전체 → 기존 시험 포함 PASS.
- [ ] **Step 6: 커밋** — `feat: 예약·판매 완료 상태를 바꾸는 규칙을 더한다(#이슈)`

### Task S3: 예약 상대 목록과 예약 걸기

**Files:**
- Create: `D/product/app/service/ProductReservationService.java`, `D/product/app/dto/ChatPartnerDto.java`
- Modify: `D/chat/repository/ChatRoomUserRepository.java` (필요한 조회 하나), `W/product/controller/ProductController.java`
- Create: `W/product/dto/ChatPartnerResponse.java`, `W/product/dto/ReservationRequest.java`
- Test: `DT/product/app/ProductReservationServiceTest.java`

**Interfaces:**
- Consumes: S1 `Product.reserveFor`, S2 `ChatTradeNoticeService.post`, `UserBlockRepository.existsByBlockerIdAndBlockedUserId`
- Produces:
  - `List<ChatPartnerDto> ProductReservationService.listChatPartners(Long productId, String sellerEmail)` — `ChatPartnerDto(Long userId, String nickname, String profileImageUrl, LocalDateTime lastMessageAt)`, `lastMessageAt` 내림차순
  - `List<ChatSystemNotice> ProductReservationService.reserve(Long productId, Long buyerId, String sellerEmail)`
  - `GET /api/products/{productId}/chat-partners` → `SuccessResponse<List<ChatPartnerResponse>>`
  - `POST /api/products/{productId}/reservation` body `{ "buyerId": number }` → `SuccessResponse<Void>`, 끝에 notices 를 웹소켓으로 보낸다
  - `ErrorCode.RESERVATION_BUYER_NOT_PARTNER(400, "이 상품으로 채팅한 사람만 예약할 수 있습니다.")`, `ErrorCode.RESERVATION_NOT_ALLOWED(400, "판매중인 판매 상품만 예약할 수 있습니다.")`

- [ ] **Step 1: 실패하는 시험 쓰기**

```
listChatPartners_returnsSnapshotNicknameAndPhoto     → ChatRoomUser 저장값, 최근 대화 순
listChatPartners_excludesLeft_blocked_withdrawn       → 셋 다 빠짐
listChatPartners_byNonSeller_rejected                → AuthenticationFailedException
reserve_partner_setsBuyerAndPostsNotices              → 상태 RESERVED, reservedBuyerId=buyer,
                                                        post(…, "예약됐어요. 여기서 결제할 수 있어요", "판매자가 다른 분과 예약해서 대화가 잠시 멈췄어요")
reserve_notPartner_rejected                           → RESERVATION_BUYER_NOT_PARTNER
reserve_alreadyReserved_rejected                      → RESERVATION_NOT_ALLOWED
reserve_requestProduct_rejected                       → RESERVATION_NOT_ALLOWED (productType=REQUEST)
reserve_zeroPrice_allowed                             → 예약은 된다
```

- [ ] **Step 2: 실행해서 실패 확인** — `--tests '*ProductReservationServiceTest'`.
- [ ] **Step 3: 구현** — 판매자 확인은 `updateTradeStatus` 와 같은 방식. "채팅한 사람"은 이 상품 방의 활성 참여자 중 판매자가 아닌 사람.
- [ ] **Step 4: 컨트롤러 두 주소** — `@PreAuthorize("isAuthenticated()")`.
- [ ] **Step 5: 실행해서 통과 확인** — `./gradlew test`.
- [ ] **Step 6: 커밋** — `feat: 판매자가 채팅한 상대를 골라 예약한다(#이슈)`

### Task S4: 채팅 막기와 방 상태 응답

**Files:**
- Modify: `D/chat/app/service/ChatServiceImpl.java` (`createChatRoom` 65~135줄, `sendMessage` 256~290줄, 방 목록 만드는 곳 200~225줄, `getChatRoomListItem`)
- Modify: `D/chat/app/dto/ChatRoomListItemDto.java`, `W/chat/dto/ChatRoomListItemResponse.java`, `D/exception/ErrorCode.java`
- Test: `DT/chat/app/ChatTradeGuardTest.java`

**Interfaces:**
- Consumes: S1 `ChatRoomState.of / canPay`, S2 `PaymentRepository.existsByProductIdAndStatus(productId, DONE)`
- Produces:
  - `ChatRoomListItemDto` / `ChatRoomListItemResponse` 에 `String roomState`(`ChatRoomState.name()`), `boolean canPay`
  - `ErrorCode.CHAT_PRODUCT_RESERVED(400, "예약된 상품이라 새 채팅을 시작할 수 없습니다.")`, `ErrorCode.CHAT_ROOM_PAUSED(400, "지금은 이 채팅방에 메시지를 보낼 수 없습니다.")`

- [ ] **Step 1: 실패하는 시험 쓰기**

```
createChatRoom_reservedForOther_rejected              → CHAT_PRODUCT_RESERVED (기존 방이 있어도)
createChatRoom_reservedBuyer_allowed
createChatRoom_legacyReserved_allowed                 → 예약자 없음
sendMessage_buyerToPausedRoom_rejected                → CHAT_ROOM_PAUSED
sendMessage_sellerToPausedRoom_rejected               → CHAT_ROOM_PAUSED (판매자도)
sendMessage_afterPaid_rejected                        → CHAT_ROOM_PAUSED (CLOSED_DONE)
sendMessage_reservedBuyersRoom_allowed
roomListItem_hasStateAndCanPay                        → 예약자 방: OPEN/true, 남의 방: PAUSED_RESERVED/false
roomListItem_hasNoReservedBuyerId                     → DTO 에 예약자 번호 필드가 없다 (리플렉션으로 필드 이름 검사)
```

- [ ] **Step 2: 실행해서 실패 확인** — `--tests '*ChatTradeGuardTest'`.
- [ ] **Step 3: 구현** — 방의 구매자 = 방 참여자 중 `product.sellerId` 가 아닌 사람. 거절은 `BusinessException` 으로 하고, STOMP 보내기 실패는 지금 오류 처리(`/queue/errors/{session}`)를 그대로 탄다.
- [ ] **Step 4: 실행해서 통과 확인** — `./gradlew test`.
- [ ] **Step 5: 커밋** — `feat: 예약된 상품의 채팅을 막고 방 상태를 응답에 담는다(#이슈)`

### Task S5: 결제 주문과 확정

**Files:**
- Modify: `D/payment/model/Payment.java`, `D/payment/repository/PaymentRepository.java` (S2 에서 만든 것)
- Create: `D/payment/app/PaymentService.java`, `D/payment/app/PaymentGateway.java`(인터페이스), `D/payment/app/dto/PaymentOrderDto.java`, `D/payment/app/dto/PaymentConfirmCommand.java`, `D/payment/app/dto/PaymentResultDto.java`, `D/payment/app/PaymentGatewayException.java`
- Create: `W/payment/TossPaymentGateway.java`(구현), `W/payment/TossKeyGuard.java`, `W/payment/PaymentController.java`, `W/payment/dto/*`
- Modify: `cmarket/src/main/resources/application-prod.properties` (`toss.secret-key=${TOSS_SECRET_KEY:}`), `D/exception/ErrorCode.java`
- Test: `DT/payment/app/PaymentServiceTest.java`, `cmarket/src/test/java/org/cmarket/cmarket/web/payment/TossKeyGuardTest.java`

**Interfaces:**
- Consumes: S1 `ChatRoomState.canPay`, S2 `ChatTradeNoticeService.post`
- Produces:
  - `Payment`: `orderId`(유일, 6~64자 `[A-Za-z0-9_-]`), `productId`, `buyerId`, `sellerId`, `amount`, `status`, `paymentKey`, `approvedAt`, `failReason`, `createdAt`. 생성자 `@Builder`. 메서드 `markDone(String paymentKey, LocalDateTime approvedAt)`, `markFailed(String reason)`
  - `enum PaymentStatus { READY, DONE, FAILED }`
  - `PaymentRepository.findByOrderIdForUpdate(String orderId)` (`@Lock(PESSIMISTIC_WRITE)`)
  - `PaymentOrderDto PaymentService.prepareOrder(String buyerEmail, Long productId)` — `(orderId, amount, orderName)`
  - `PaymentResultDto PaymentService.confirm(String buyerEmail, PaymentConfirmCommand cmd)` — `cmd(paymentKey, orderId, amount)`, 결과 `(orderId, amount, productId, productTitle, approvedAt, List<ChatSystemNotice> notices)`
  - `PaymentGateway.confirm(String paymentKey, String orderId, long amount): LocalDateTime approvedAt` — 실패면 `PaymentGatewayException(String code, String message)`
  - `TossPaymentGateway`: `POST https://api.tosspayments.com/v1/payments/confirm`, 헤더 `Authorization: Basic base64(secretKey + ":")`, `Idempotency-Key: UUID`, 본문 `{paymentKey, orderId, amount}`. `RestTemplate` (저장소의 `NaverGeocodingClient` 와 같은 방식)
  - `TossKeyGuard.isUsable(): boolean` — 키가 `test_sk_` 로 시작할 때만 참
  - `POST /api/payments/orders` `{productId}` → `{orderId, amount, orderName}`; `POST /api/payments/confirm` `{paymentKey, orderId, amount}` → `{orderId, amount, productId, productTitle, approvedAt}`. 키가 안 쓰이면 둘 다 503 `SERVICE_UNAVAILABLE`
  - `ErrorCode.PAYMENT_NOT_ALLOWED(400, "지금은 결제할 수 없습니다.")`, `PAYMENT_AMOUNT_MISMATCH(400, "결제 금액이 상품 가격과 다릅니다. 다시 시도해 주세요.")`, `PAYMENT_FAILED(400, "결제에 실패했습니다.")`

- [ ] **Step 1: 실패하는 시험 쓰기** (`PaymentGateway` 는 Mockito 가짜)

```
prepareOrder_reservedBuyer_savesReadyWithCurrentPrice
prepareOrder_notReservedBuyer_rejected                 → PAYMENT_NOT_ALLOWED
prepareOrder_zeroPrice_rejected                        → PAYMENT_NOT_ALLOWED
confirm_ok_marksDone_completesProduct_postsNotice      → DONE, 상품 COMPLETED, post(…, "결제가 완료됐어요", null) — 나머지 방엔 한 줄 없음
confirm_amountDiffersFromOrder_rejected_noGateway      → PAYMENT_AMOUNT_MISMATCH, gateway 안 부름
confirm_priceChanged_rejected                          → PAYMENT_AMOUNT_MISMATCH, gateway 안 부름
confirm_reservationCleared_rejected                    → PAYMENT_NOT_ALLOWED, gateway 안 부름
confirm_othersOrder_rejected                           → PAYMENT_NOT_ALLOWED
confirm_alreadyDone_returnsSameResultWithoutCallingGateway
confirm_secondOrderAfterDone_rejected                  → PAYMENT_NOT_ALLOWED
confirm_gatewayFails_marksFailed                       → FAILED, failReason=게이트웨이 message, PAYMENT_FAILED
TossKeyGuard: test_sk_ 참 / live_sk_ 거짓 / 빈 값 거짓
```

- [ ] **Step 2: 실행해서 실패 확인** — `--tests '*PaymentServiceTest'`, `--tests '*TossKeyGuardTest'`.
- [ ] **Step 3: 구현** — `ChatTradeNoticeService.post` 의 `othersText` 가 `null` 이면 나머지 방에는 쓰지 않는다(S2 시험에 한 줄 더). 확정은 주문 행을 잠그고 검사한다. 로그에 키를 찍지 않는다.
- [ ] **Step 4: 실행해서 통과 확인** — `./gradlew test` 그리고 `./gradlew build -x bootJar`.
- [ ] **Step 5: 로컬 실제 확인** — 로컬 서버를 가짜 키 없이 띄워 `POST /api/payments/orders` 가 503 인지 curl 로 본다. (테스트 비밀 키는 사용자가 직접 `export` 하고 웹 단계에서 함께 확인)
- [ ] **Step 6: 커밋** — `feat: 토스페이먼츠 테스트 결제 주문과 확정을 더한다(#이슈)`

**서버 묶음 끝: 시험 출력과 바뀐 주소 목록을 사용자에게 보여 주고 확인받는다.**

---

## 웹 (`cuddle-market`, 브랜치 `feature/<이슈>--reservation-payment`)

시험 명령: `pnpm test`, 끝에 `pnpm gate`.

### Task W1: 방 상태를 웹 타입과 조회에 더하기

**Files:**
- Modify: `src/types/chat.ts:63` 근처, `src/graphql/schema.ts:259-273` (`type ChatRoom`), `src/features/chatting-page/ChattingPage.tsx:105` (조회 칸)
- Test: 기존 시험이 깨지지 않는지 (`pnpm test`)

**Interfaces:**
- Produces: `ChatRoom.roomState: 'OPEN' | 'PAUSED_RESERVED' | 'CLOSED_SOLD' | 'CLOSED_DONE'`(없으면 `'OPEN'` 으로 본다), `ChatRoom.canPay: boolean`

- [ ] **Step 1:** 타입과 스키마, 조회 문자열에 두 칸을 더한다. GraphQL 리졸버가 REST 값을 그대로 넘기는지 `src/graphql/resolvers.ts` 에서 확인하고, 아니면 매핑을 더한다.
- [ ] **Step 2:** `pnpm test` → 기존 통과 그대로, `npx tsc --noEmit` 오류 0.
- [ ] **Step 3: 커밋** — `feat(web): 채팅방 상태와 결제 가능 여부를 받아 온다(#이슈)`

### Task W2: 마이페이지 예약 창

**Files:**
- Create: `src/features/my-page/components/ReserveBuyerModal.tsx`, `src/features/my-page/components/ReserveBuyerModal.test.tsx`
- Create: `src/lib/api/reservation.ts`
- Modify: `src/features/my-page/components/MyList.tsx` (`handleChangeTradeStatus` 100줄, 휴대폰 메뉴 217~218줄, 데스크탑 `StatusDropdown` 274줄)

**Interfaces:**
- Produces: `fetchChatPartners(productId: number): Promise<ChatPartner[]>`, `reserveProduct(productId: number, buyerId: number): Promise<void>`, `type ChatPartner = { userId: number; nickname: string; profileImageUrl: string | null; lastMessageAt: string | null }`
- `ReserveBuyerModal({ isOpen, productId, onReserved, onCancel })`

- [ ] **Step 1: 실패하는 시험 쓰기**

```
목록을 닉네임·사진과 함께 보여 준다
빈 목록이면 '아직 채팅한 사람이 없어요' 가 보이고 확정 단추가 없다
한 명을 고르고 확정하면 reserveProduct(productId, userId) 를 부르고 onReserved 를 부른다
고르기 전에는 확정 단추가 눌리지 않는다 (disabled 대신 aria-disabled — CLAUDE.md 의 jsdom 주의)
```

- [ ] **Step 2: 실행해서 실패 확인** — `pnpm test ReserveBuyerModal`.
- [ ] **Step 3: 구현** — 모달 모양은 `src/components/modal/LeaveChatRoomModal.tsx` 를 따른다. `MyList` 에서 "예약중"을 고르면 PATCH 대신 이 창을 연다. 확정 뒤 판매 목록 조회를 무효화한다.
- [ ] **Step 4: 실행해서 통과 확인** — `pnpm test`.
- [ ] **Step 5: 커밋** — `feat(web): 마이페이지에서 채팅한 상대를 골라 예약한다(#이슈)`

### Task W3: 채팅방 안내와 결제하기 단추

**Files:**
- Create: `src/features/chatting-page/components/RoomStateNotice.tsx` (+ `.test.tsx`), `src/features/chatting-page/components/PayButton.tsx` (+ `.test.tsx`)
- Modify: `src/features/chatting-page/ChattingPage.tsx:345-360` (차단 안내와 같은 자리), `src/features/chatting-page/components/ChatRoomInfo.tsx:56-60, 241-243` (상품 조회에 `price` 를 더하고 단추를 놓는다)

**Interfaces:**
- Consumes: W1 `roomState`, `canPay`; W4 `startCardPayment`
- Produces: `RoomStateNotice({ roomState })` — `OPEN` 이면 아무것도 안 그림. `PayButton({ productId, price })`

- [ ] **Step 1: 실패하는 시험 쓰기**

```
RoomStateNotice: PAUSED_RESERVED → '예약된 상품이에요', CLOSED_SOLD → '판매 완료된 상품이에요', CLOSED_DONE → '거래가 끝난 채팅방이에요', OPEN → 빈 화면
ChattingPage: roomState 가 OPEN 이 아니면 입력칸 대신 안내가 보인다
PayButton: 지금 가격과 '테스트 결제예요. 실제로 돈이 나가지 않아요' 를 보여 준다
PayButton: 누르면 서버 주문을 만들고 startCardPayment 에 그 주문을 넘긴다
ChatRoomInfo: canPay 가 거짓이면 결제하기가 없다
```

- [ ] **Step 2: 실행해서 실패 확인** — `pnpm test RoomStateNotice PayButton`.
- [ ] **Step 3: 구현** — 가격은 채팅방 저장값(`productPrice`)이 아니라 상품 조회의 지금 가격. 클라이언트 키가 없으면 단추는 "결제 준비 중"으로 막는다.
- [ ] **Step 4: 실행해서 통과 확인** — `pnpm test`.
- [ ] **Step 5: 커밋** — `feat(web): 채팅방에 예약·판매 완료 안내와 결제하기를 더한다(#이슈)`

### Task W4: 토스 결제창과 성공·실패 페이지

**Files:**
- Modify: `package.json` (`pnpm add @tosspayments/tosspayments-sdk`)
- Create: `src/lib/payments/toss.ts`, `src/lib/api/payment.ts`
- Create: `src/app/(main)/payments/success/page.tsx`, `src/app/(main)/payments/fail/page.tsx`, `src/features/payment/PaymentSuccess.tsx` (+ `.test.tsx`), `src/features/payment/PaymentFail.tsx` (+ `.test.tsx`)

**Interfaces:**
- Produces:
  - `createPaymentOrder(productId: number): Promise<{ orderId: string; amount: number; orderName: string }>`
  - `confirmPayment(input: { paymentKey: string; orderId: string; amount: number }): Promise<{ orderId: string; amount: number; productId: number; productTitle: string; approvedAt: string }>`
  - `startCardPayment(order, customerKey): Promise<void>` — `loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)` → `payment({ customerKey }).requestPayment({ method: 'CARD', amount: { currency: 'KRW', value }, orderId, orderName, successUrl: origin + '/payments/success', failUrl: origin + '/payments/fail' })`

- [ ] **Step 1: 실패하는 시험 쓰기**

```
PaymentSuccess: 주소의 paymentKey·orderId·amount 로 confirmPayment 를 한 번만 부른다 (StrictMode 두 번 실행에도)
PaymentSuccess: 성공하면 상품 이름, 금액, 테스트 결제 안내, 채팅방으로 돌아가는 링크
PaymentSuccess: 서버가 거절하면 그 이유와 다시 시도할 길
PaymentFail: 주소의 message 를 보여 주고 채팅으로 돌아가는 링크
```

- [ ] **Step 2: 실행해서 실패 확인** — `pnpm test PaymentSuccess PaymentFail`.
- [ ] **Step 3: 구현** — 토스 API 를 웹에서 직접 부르지 않는다. `customerKey` 는 `ANONYMOUS`.
- [ ] **Step 4: 실행해서 통과 확인** — `pnpm test`.
- [ ] **Step 5: 커밋** — `feat(web): 토스페이먼츠 테스트 결제창과 결과 페이지를 더한다(#이슈)`

### Task W5: 약관 문구와 마무리 게이트

**Files:**
- Modify: `src/app/(main)/terms/page.tsx:219`, `src/app/(main)/privacy/page.tsx:161` 근처

- [ ] **Step 1:** 설계 11절 문장을 그대로 넣는다.
- [ ] **Step 2:** `pnpm gate` → tsc·lint(경고 31 이하)·vitest·next build 통과.
- [ ] **Step 3: 로컬 화면 확인** — 로컬 서버(8080) + `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api pnpm dev` 로 3000 에서: 예약 창 → C 방 멈춤 → A 결제(사용자가 테스트 키를 직접 `export`·`.env.local` 에 넣은 뒤) → 판매 완료와 방 닫힘.
- [ ] **Step 4: 커밋** — `docs(web): 결제 테스트 모드에 맞춰 약관 문구를 고친다(#이슈)` (커밋 종류는 commitlint 가 받는 것으로)

**웹 묶음 끝: 시험 출력과 화면을 사용자에게 보여 주고 확인받는다. 그다음 PR(develop) 은 사용자 허락 뒤.**

---

## Task D: 배포 (사용자와 함께)

- [ ] cmarket_api push (허락) → 사용자가 EC2 에서 `cp -a proxy ~/proxy-backup` → `git pull` → `cp -a ~/proxy-backup/. proxy/` → 빌드 → `TOSS_SECRET_KEY` `export` 후 `printenv TOSS_SECRET_KEY | cut -c1-8` 이 `test_sk_` 인지 → 다시 켬 → `POST /api/payments/orders` 가 503 이 아닌지(401 이어야 함, 로그인 필요).
- [ ] 웹 PR → 사용자 머지 → Vercel 에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` → 운영 화면에서 테스트 결제 한 번.

## 월요일 전에 꼭 / 미뤄도 되는 것

- **꼭**: S1~S5, W1~W5. 하나라도 빠지면 설계의 "실패로 보는 것"에 걸린다(남이 결제, 금액 조작, 예약자 노출, 거짓 약관).
- **미뤄도 됨**: 앱의 멈춘 방 안내(설계 13절), 운영 결제 전환.
