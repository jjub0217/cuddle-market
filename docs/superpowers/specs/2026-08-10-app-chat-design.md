# 앱 채팅 1.0 설계 (#871 · 20바퀴)

> 2026-08-10(월). 앱에 **연결 계층을 처음 놓는 바퀴**다.
> 앞선 연결 실험 결과는 `docs/superpowers/plans/2026-08-10-chat-handoff.md` 에 있다.

## 왜 지금인가

앱에는 실시간이 하나도 없었다. 알림조차 「화면에 들어올 때마다 다시 조회」다.
채팅은 안드로이드 1.0 출시 목록의 마지막 큰 조각이고, 지금 웹으로만 되는 유일한 화면이다.
알림을 눌러도 앱 채팅방이 없어 **웹 브라우저로 나간다** — 앱만 쓴 사람은 거기서 로그인 화면을 만난다.

## 이미 확인한 것 (다시 조사하지 말 것)

실기기와 맥에서 직접 재서 확인했다.

```
RN 위에서 @stomp/stompjs      돈다 — 단 forceBinaryWSFrames 가 있어야 한다
서버 인증(CONNECT)             통과한다
구독                           /user/queue/errors · chat-room-list · chat 셋 다
백그라운드                     66초 뒤 복귀에도 연결 유지 · 하트비트 정상
```

⚠️ **`forceBinaryWSFrames: true` 를 빠뜨리면 오류도 로그도 없이 침묵한다.**
RN 의 WebSocket 이 STOMP 프레임 끝의 NULL 문자를 흘려서, 서버가 「메시지가 아직 안 끝났다」고
보고 계속 기다리기 때문이다. 자세한 건 `mobile/AGENTS.md` 함정 표에 있다.

## 범위

### 만든다

```
채팅 탭(방 목록)          하단 탭바에 다섯 번째로 들어간다 — 플레이스와 마이 사이
채팅방                    글 읽기·보내기
상품 상세 「채팅하기」      웹과 같은 자리·같은 문구
방 나가기
알림 → 앱 채팅방          지금은 웹 브라우저로 나간다. 그 갈래를 없앤다
차단된 내 메시지 표시      아래 「왜 차단 표시를 넣나」
```

### 안 만든다

```
사진 전송           고르기·압축·업로드·IMAGE 타입까지 붙어 일이 눈에 띄게 늘어난다
상대 탈퇴 표시      서버 응답에 필드가 없다. 백엔드를 고치고 배포를 기다려야 한다
웹의 탭바 문제      아래 「발견 사항」에만 적는다
```

### 왜 차단 표시를 넣나

서버는 개인정보가 든 메시지를 막는다(`isBlocked`). 그런데 **막힌 것은 보낸 사람에게만 온다** —
받는 쪽에서는 서버가 아예 걸러낸다(`ChatServiceImpl:390`).

표시가 없으면 보낸 사람 화면에는 **정상으로 보이고** 상대는 못 받는다. 「읽씹당했다」는
오해를 부른다 — 탈퇴 표시를 넣기로 한 것과 같은 이유다. 조건문 하나라 값이 싸다.

웹 문구를 그대로 쓴다: **「개인정보 포함으로 상대방에게 전송되지 않았습니다.」**

## 정한 것 셋

### ① 연결은 채팅 화면에 있는 동안만

웹과 같은 방향이다. 앱을 켠 내내 붙여 두면 탭바에 안 읽은 개수를 실시간으로 달 수 있지만,
백그라운드·복귀 재연결을 직접 다뤄야 하고 배터리도 더 쓴다. **다른 화면에 있을 때 새 메시지는
이미 있는 알림으로 알 수 있다**(`CHAT_NEW_ROOM` · `CHAT_NEW_MESSAGE`). 그래서 단순한 쪽을 고른다.

⚠️ **「채팅 탭에 있는 동안」이라고 하면 안 된다.** 방은 루트 화면이라 탭 바깥이고,
상품 상세와 알림에서 **탭을 거치지 않고 바로** 들어온다. 그러면 소켓이 안 붙은 채로 방이 열린다.

그래서 **목록과 방이 각자 「쓰는 중」이라고 알리고, 쓰는 화면이 하나도 없을 때 끊는다.**
소켓 모듈이 세는 수(참조 세기)를 하나 들고 있으면 된다.

```
목록 열림        쓰는 곳 1  →  붙는다
목록 → 방        쓰는 곳 2  →  이미 붙어 있으니 그대로
방 닫힘          쓰는 곳 1  →  그대로 (목록이 아직 본다)
목록 닫힘        쓰는 곳 0  →  끊는다

알림 → 방 (탭을 안 거침)   쓰는 곳 1  →  붙는다
```

⚠️ 화면 전환은 **겹친다** — 새 화면이 뜨고 나서 옛 화면이 사라진다. 그래서 목록에서 방으로
갈 때 잠깐 0 이 되어 끊었다 다시 붙는 일은 없다. 반대로 방에서 뒤로 갈 때 0 이 스쳐 지나갈 수
있으니, **끊기는 조금 늦춘다**(몇 초). 실기기로 확인할 항목이다.

### ② 목록에는 탭바를 둔다 — 웹과 다르게

웹은 채팅이 하단 탭 항목인데 들어가면 그 탭바를 없앤다(`isBottomNavHidden.ts`).
다른 탭으로 갈 길이 사라진다. **웹이 스스로 어긋난 곳이라 따라가지 않는다.**

```
목록   탭바 있음    커뮤니티·플레이스 탭과 같은 결
방     탭바 없음    아래에 입력칸이 늘 열려 있어 두 겹이 된다 (댓글 스레드와 같은 판단)
```

### ③ 채팅방은 루트에 둔다

들어오는 길이 셋이다 — 채팅 탭 · 상품 상세(홈 탭) · 알림(루트).
탭 안 스택에 두면 **다른 탭에서 열 때 탭이 튄다**(`mobile/AGENTS.md` 함정).
알림 화면이 이미 루트에 있는 것과 같은 이유다.

```
mobile/app/(tabs)/(chat)/index.tsx    목록
mobile/app/chat/[id].tsx              방
```

## 조각 나누기

| 파일 | 하는 일 | 무엇에 기대나 |
|---|---|---|
| `mobile/lib/chat/api.ts` | REST 넷 | 앱의 기존 api 클라이언트 |
| `mobile/lib/chat/socket.ts` | STOMP 클라이언트 하나 — 붙기·끊기·구독·발행 | `@stomp/stompjs` · 토큰 저장소 |
| `mobile/lib/chat/messages.ts` | 순수 함수 — 날짜별 묶기 · 내 것 판별 · 과거+실시간 합치기 | 없음 (시험하기 쉽다) |
| `mobile/components/chat/*` | 방 줄 · 말풍선 · 입력칸 | 위 셋 |
| `packages/shared` | 채팅 시각 포맷터 | 없음 |

**시각 포맷터를 `shared` 로 올리는 것은 저장소 규칙이다.** 지금 웹의 `ChatLog.tsx` 안에
`chatFormatTime` · `chatFormatDate` 가 갇혀 있어 앱이 못 쓴다. 18바퀴에 날짜 표기가
웹 셋 · 앱 하나로 갈라졌던 것과 똑같은 모양이다. 웹은 재수출 껍데기만 남긴다.

**순수 함수를 따로 빼는 이유**는 소켓과 화면을 뺀 나머지가 시험할 수 있는 전부이기 때문이다.

## 서버 계약 (직접 열어 확인한 것)

### REST — 모두 `/api/chat` 아래

```
POST   /rooms                    productId 로 방 만들기 → ChatRoomResponse
GET    /rooms?page&size          방 목록        → ChatRoomListResponse
GET    /rooms/{id}/messages      메시지 (읽음 처리가 여기서 일어난다)
DELETE /rooms/{id}               방 나가기
```

### STOMP

```
붙기   wss://cmarket-api.duckdns.org/ws-stomp      ⚠️ 웹의 SockJS 주소와 다르다
구독   /user/queue/chat · /user/queue/chat-room-list · /user/queue/errors
발행   /app/chat/message   { chatRoomId, content, messageType, imageUrl }
```

### 응답 필드

```
ChatRoomListItemResponse   chatRoomId · productId · productTitle · productPrice · productImageUrl
                           opponentId · opponentNickname · opponentProfileImageUrl
                           lastMessage · lastMessageTime · hasUnread · unreadCount
                           (감싸개: chatRooms · currentPage · totalPages · hasNext · hasPrevious)

ChatMessageListItemResponse  messageId · senderId · senderNickname · messageType
                             content · imageUrl · isBlocked · blockReason · createdAt · isMine
                             (감싸개: messages · currentPage · … )

ChatRoomResponse           chatRoomId · productId · productTitle · productPrice
                           productImageUrl · sellerNickname · sellerProfileImageUrl · createdAt
                           ⚠️ opponentId 가 없다. 방을 만든 직후에는 목록에서 다시 찾아야 한다
```

`messageType` 은 `TEXT` · `IMAGE` · `SYSTEM` 셋이다. **`SYSTEM` 은 이번에도 그려야 한다** —
방 가운데 알약 모양으로 나오는 안내다(웹과 같은 모양).

## 데이터 흐름

```
목록 진입   STOMP 붙기  →  REST 로 방 목록  →  chat-room-list 구독
방 진입     STOMP 붙기(이미 붙어 있으면 그대로)  →  REST 로 메시지  →  chat 구독
                                                    이때 서버가 읽음 처리를 한다
받기        /user/queue/chat 로 새 메시지가 오면 그 방 목록에 붙인다
보내기      /app/chat/message 로 발행  →  서버가 되돌려준 것을 화면에 붙인다
둘 다 닫힘  끊기
```

⚠️ **구독은 붙은 뒤에만 된다.** `CONNECTED` 가 오기 전에 구독하면 조용히 버려진다.

⚠️ **순서는 「붙기 → 구독 → REST 조회」다.** REST 를 먼저 부르면 조회가 끝난 뒤 구독하기까지의
틈에 온 메시지를 놓친다. 구독을 먼저 걸어 두면 그 틈이 없다. 대신 같은 메시지가 양쪽으로
들어올 수 있으니 **`messageId` 로 겹치는 것을 거른다** — 그 거르는 일을 `lib/chat/messages.ts`
의 순수 함수로 두고 시험한다.

**보낸 메시지를 미리 그려두지 않는다.** 서버가 되돌려주는 것을 기다린다.
차단된 메시지를 서버가 표시해서 돌려주기 때문에, 미리 그리면 정상으로 보였다가 바뀌게 된다.

## 함정 (실측으로 확인한 것)

### 서버 시각에 시간대가 없다

`2026-08-10T07:12:42` 처럼 온다. 그냥 `new Date()` 로 읽으면 **9시간 어긋난다.**
서버 JVM 이 UTC 로 돌아서 값 자체는 UTC 인데 표시가 없는 것이다.

`packages/shared/src/lib/timeAgo.ts` 가 이미 이렇게 다룬다 — 같은 방식으로 간다.

```ts
new Date(hasTimezone ? createdAt : `${createdAt}Z`)
```

### 과거 메시지는 위에 붙인다

서버는 **최신부터** 50개를 가져와 **그 페이지 안에서만** 뒤집어 오래된순으로 준다.

```
page 0   [ 오래된 → 최신 ]  가장 최근 50개
page 1   [ 오래된 → 최신 ]  그 이전 50개     ← page 0 보다 앞에 와야 한다
```

그래서 더 불러온 것은 **앞에 붙여야** 한다. 뒤에 이어붙이면 과거가 아래로 간다.

### 안드로이드 키보드

`edgeToEdgeEnabled: true` 라 창이 저절로 줄지 않는다. `KeyboardAvoidingView` 에
**안드로이드도** `behavior="padding"` 을 준다. 그리고 **목록과 입력칸을 함께** 감싼다 —
입력칸만 감싸면 목록이 안 밀려 키보드가 칸을 덮는다. (`mobile/AGENTS.md` 함정 둘)

## 오류 처리

| 언제 | 어떻게 |
|---|---|
| 소켓이 안 붙는다 | 목록·메시지는 REST 로 이미 보인다. 위쪽에 「연결 중」 띠를 두고 자동 재연결(5초) |
| 보내려는데 안 붙어 있다 | 보내기를 막고 토스트로 알린다. 웹과 같은 판단이다 |
| `/user/queue/errors` 로 온 오류 | 토스트로 그대로 보여준다 |
| 방 목록·메시지 조회 실패 | 앱의 기존 오류 화면 규칙을 따른다 (다시 시도 단추) |
| 로그인 안 한 사람 | 채팅 탭 전환 자체를 막고 로그인 화면을 띄운다 — 마이 탭과 같은 방식 |

## 시험

```
jest (mobile)   lib/chat/messages.ts   날짜 묶기 · 과거를 앞에 붙이기 · 내 것 판별 · 차단 표시
                                       messageId 로 겹치는 메시지 거르기
                lib/chat/api.ts        실제 DTO 모양의 가짜 응답으로 파싱 확인
vitest (shared) 시각 포맷터            시간대 없는 값에 Z 를 붙이는지

사람 눈 (실기기)  두 계정으로 주고받기 · 백그라운드 복귀 · 알림에서 진입
                 상품 상세에서 방 만들기 · 방 나가기 · 키보드가 입력칸을 안 덮는지
```

⚠️ **소켓 연결 자체는 유닛 시험으로 못 덮는다.** 20바퀴에 겪었듯 **게이트가 초록인데
폰만 침묵**할 수 있다. 실기기 확인이 진짜 게이트다.

## 발견 사항 (이번 범위 밖)

고칠지는 사용자가 정한다. 여기서는 적어만 둔다.

```
웹 탭바      /chat 과 /chat/{id} 에서 하단 탭바를 숨긴다. 채팅이 탭 항목인데 들어가면
             그 탭바가 사라져 다른 탭으로 갈 길이 없다 (isBottomNavHidden.ts)

웹 과거 순서  ChattingPage 가 페이지를 뒤에 이어붙여서, 더 불러온 과거 메시지가
             아래로 간다 (ChattingPage.tsx:77)

운영 비밀     EC2 의 java 프로세스가 -D 옵션으로 DB 비밀번호·JWT 시크릿을 넘겨서
             ps -ef 에 그대로 보인다. 환경변수 파일로 옮기는 게 좋다
```

## 다음 바퀴로 미룬 것

```
사진 전송
상대 탈퇴 표시   백엔드에 필드 추가가 먼저다. 입력칸을 잠글지도 함께 정한다
탭바 안 읽은 뱃지  연결을 앱 전체로 넓혀야 한다
```

## 관련

- 이슈 #871
- 연결 실험 기록: `docs/superpowers/plans/2026-08-10-chat-handoff.md`
- 앱 함정: `mobile/AGENTS.md`
- 백엔드: `~/Desktop/cmarket_api` (로그 보는 법은 저장소 루트 `CLAUDE.md`)
