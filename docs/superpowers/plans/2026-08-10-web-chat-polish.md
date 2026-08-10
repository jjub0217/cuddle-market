# 웹 채팅 다듬기 구현 계획 (#872 · #874 · #875)

> **에이전트에게:** 이 계획은 한 과제씩 실행한다. 단계는 체크상자(`- [ ]`)로 표시한다.

**목표:** 웹 채팅 화면의 세 가지를 고친다 — 말풍선이 화면 폭을 다 쓰는 것, 알림 개수가 안 보이는 것,
되돌릴 수 없는 동작이 확인 없이 실행되는 것. 그리고 **차단이 이름값을 하게** 만든다.

**구조:** 대부분 웹 화면 작업이다. 다만 「차단하면 채팅이 막힌다」를 지키려면 백엔드가 붙고,
**앱도 입력창을 잠가야 한다** — 앱 채팅방에는 차단 메뉴가 없지만 상품 상세·프로필에서 차단할 수
있어서, 그 방이 앱에 그대로 남는다. 지금은 모달이 「차단하면 채팅을 못 받는다」고 약속하는데
**채팅 서비스가 차단을 전혀 안 본다.**

**기술:** Next.js · Tailwind v4 · GraphQL BFF · TanStack Query · Expo(앱) · Spring Boot(백엔드)

### 앱은 어디까지 걸리나

```
① 차단이 채팅을 막는다     백엔드라 앱에도 저절로 걸린다        자동
② 입력창 잠금             **앱도 고친다**                     과제 4에 있다
③④⑤⑥⑦⑧                  앱 채팅방에는 더보기 메뉴가 없다      해당 없음
⑨ 토스트                  앱은 이미 토스트를 쓴다               이미 됨
#872 말풍선 · #874 뱃지    앱은 20바퀴에 끝났다                 이미 됨
```

## 전체에 걸리는 규칙

- **게이트는 저장소 루트에서** — `pnpm gate` (tsc + lint + vitest + next build)
- **문구를 새로 짓지 않는다.** 앱에 같은 화면이 있으면 그 문구를 가져온다.
- **백엔드 일로 이슈를 만들지 않는다** — 고칠 내용은 #875 본문이나 PR 본문에 적는다(`CLAUDE.md` 규칙).
- **백엔드는 이 맥에서 컴파일이 안 된다**(JDK 11, 프로젝트 21). 푸시하면 사용자가 EC2에서 배포한다.
  ⚠️ **엔티티에 필드를 더할 때는 생성자도 같이 고친다** — 이 저장소는 생성자에 `@Builder` 를 단다.
- **커밋은 과제마다.** 푸시·PR·머지는 사용자가 요청할 때만.
- **`alert()` 를 새로 쓰지 않는다.** 웹에는 `src/store/toastStore.ts` 가 있다.

## 어디까지 했나

```
✅ 과제 1  말풍선 최대 너비        892a0988
✅ 과제 2  나가기 확인창           33553476  (과제 3과 같은 파일이라 한 커밋)
✅ 과제 3  차단·신고를 공용 창으로  33553476 · ba31711b
✅ 과제 5  알림 개수 뱃지          e836904c
□  과제 4  차단이 채팅을 막는다     → **#877 로 옮겼다.** 백엔드 배포가 필요해 따로 뺐다
```

## 정해진 것 (합의 완료)

```
① 차단이 채팅을 실제로 막는다          백엔드 + 웹
   └ 차단당한 쪽에는 알리지 않는다     조용히 상대에게만 안 간다(카카오톡 방식)
② 차단 후 방은 남기고 입력창을 잠근다
③ 차단 직후 방에 남는다
④ 신고는 UserReportModal 로 사유를 고르게
⑤ 신고 뒤 차단을 잇지 않는다
⑥ 상대가 방을 나가도 신고·차단은 그대로 둔다   (코드 변경 없음)
⑦ 상대가 회원 탈퇴했으면 메뉴에서 감춘다
⑧ 방금 만든 방에서도 신고·차단 가능           (코드 변경 없음)
⑨ 결과는 토스트로 알린다
말풍선 최대 너비는 글자 수 기준
```

---

### 과제 1: 말풍선 최대 너비 (#872)

**파일**
- 고친다: `src/features/chatting-page/components/ChatLog.tsx` (보통 말풍선 `<span>`)

⚠️ **`ch` 를 그대로 쓰면 안 된다.** `ch` 는 「0」 글자의 폭인데 **한글은 그 두 배쯤**이다.
`45ch` 로 잡으면 한글은 22자쯤에서 꺾인다. **실제로 재서 값을 정한다.**

- [ ] **단계 1: 지금 값을 잰다**

개발 서버를 띄우고 채팅방에서 긴 메시지의 말풍선 폭을 잰다.

```bash
pnpm dev
```

브라우저 콘솔에서:

```js
document.querySelectorAll('li span')  // 말풍선을 찾아
  .forEach(el => console.log(el.offsetWidth, el.textContent.slice(0, 12)))
```

- [ ] **단계 2: 한글 한 줄이 몇 자인지 재서 값을 정한다**

목표는 **한 줄에 한글 35~45자**다. 그보다 길면 눈이 다음 줄 앞으로 못 돌아온다.
콘솔에서 `ch` 실측:

```js
const p = document.createElement('span')
p.style.cssText = 'position:absolute;visibility:hidden;font:14px system-ui'
p.textContent = '0'.repeat(10); document.body.append(p)
console.log('1ch =', p.offsetWidth / 10)
p.textContent = '가'.repeat(10)
console.log('한글 1자 =', p.offsetWidth / 10)
```

두 값의 비로 `Nch` 를 정한다. **잰 값을 주석에 남긴다.**

- [ ] **단계 3: 고친다**

`ChatLog.tsx` 의 보통 말풍선(막힌 메시지 말고)에 최대 너비를 준다.

```tsx
'rounded-b-2xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[<잰값>ch]',
```

주석으로 근거를 남긴다.

```tsx
{/* 한 줄에 한글 35~45자에서 꺾는다. 그보다 길면 줄 끝에서 다음 줄 앞으로 눈이 못 돌아온다.
    ⚠️ ch 는 「0」 글자 폭이라 한글은 약 2배다 — 2026-08-10에 재서 정한 값이다.
    앱은 maxWidth: '72%' 를 쓴다(폭이 좁아 비율로 충분하다). */}
```

- [ ] **단계 4: 폰 폭에서도 본다**

개발자 도구로 375px 폭에서 본다. **말풍선이 화면보다 넓어지면 안 된다** — `max-w-` 는 상한이라
좁은 화면에서는 저절로 줄지만, `min-w` 가 걸린 게 없는지 확인한다.

- [ ] **단계 5: 게이트 · 커밋**

```bash
pnpm gate
git add src/features/chatting-page/components/ChatLog.tsx
git commit -m "fix(web): 채팅 말풍선에 최대 너비를 준다 (#872)"
```

---

### 과제 2: 나가기 확인창 (#875)

**파일**
- 만든다: `src/components/modal/LeaveChatRoomModal.tsx`
- 고친다: `src/features/chatting-page/components/ChatRoomInfo.tsx`

`DeleteReplyModal.tsx` 가 가장 가까운 본보기다 — `<dialog>` + `ModalTitle` + 취소/실행 단추 둘.

- [ ] **단계 1: 모달을 만든다**

`DeleteReplyModal.tsx` 를 본보기로 삼되 문구는 **앱과 같게** 한다.

```tsx
<ModalTitle
  headingId="leave-chat-room-modal-title"
  heading="채팅방을 나갈까요?"
  description="나가면 이 채팅방의 대화 내용이 사라져요."
/>
```

실행 단추는 「나가기」, `bg-danger-600`. 실패하면 `InlineNotification` 으로 알린다
(`DeleteReplyModal` 과 같은 방식).

- [ ] **단계 2: 메뉴에 붙인다**

`ChatRoomInfo.tsx` 의 `handleOutChatRoom` 을 **바로 실행하지 말고** 모달을 연다.

```tsx
{ label: '채팅방 나가기', onClick: () => { setIsMenuOpen(false); setIsLeaveOpen(true) }, className: 'text-danger-500' },
```

기존 `handleOutChatRoom` 은 모달의 `onConfirm` 으로 넘긴다.

- [ ] **단계 3: 눈으로 본다**

⋮ → 나가기 → 확인창이 뜨는가 · 취소하면 안 나가는가 · 나가기를 누르면 나가는가.

- [ ] **단계 4: 게이트 · 커밋**

```bash
pnpm gate
git commit -m "feat(web): 채팅방 나가기에 확인창을 붙인다 (#875)"
```

---

### 과제 3: 차단·신고를 있는 조각으로 바꾸고, 탈퇴한 상대를 가린다 (#875)

**이미 있는 것을 쓰는 과제다.** 새로 만들지 않는다.

```
BlockModal        차단 확인창 — UserPage · ProfileData 가 쓴다
UserReportModal   신고 모달(사유 7개+상세+사진) — UserPage 가 쓴다
```

**파일**
- 고친다: `src/features/chatting-page/components/ChatRoomInfo.tsx`

- [ ] **단계 1: 직접 부르던 GraphQL 을 걷어낸다**

`handleBlockUser` · `handleReportUser` 를 지운다. 그 안의 `alert()` 도 함께 사라진다.

- [ ] **단계 2: 두 모달을 붙인다**

`UserPage.tsx` 와 같은 방식으로 `dynamic` 으로 불러온다.

```tsx
const UserReportModal = dynamic(() => import('@/components/modal/UserReportModal'))
const BlockModal = dynamic(() => import('@/components/modal/BlockModal'))
```

```tsx
<UserReportModal isOpen={isReportOpen} userId={data.opponentId} userNickname={data.opponentNickname} onCancel={() => setIsReportOpen(false)} />
<BlockModal isOpen={isBlockOpen} userId={data.opponentId} userNickname={data.opponentNickname} onCancel={() => setIsBlockOpen(false)} />
```

⚠️ 두 모달은 성공하면 `queryClient.invalidateQueries({ queryKey: ['userPage'] })` 를 부른다.
채팅 화면은 `['chatRooms']` 를 쓰므로 **목록이 안 새로고침된다.** 이번 과제에서는 그대로 두고,
과제 4에서 입력창 잠금을 붙일 때 함께 다룬다(그때 `chatRooms` 를 무효화해야 한다).

- [ ] **단계 3: 탈퇴한 상대면 메뉴에서 감춘다 (⑦)**

`opponentId` 는 **nullable** 이다(GraphQL `opponentId: Int`). 상대가 회원 탈퇴하면 `null` 이고
닉네임이 「알 수 없는 사용자」로 온다. 지금은 눌리는데 **반드시 실패**한다.

```tsx
// 상대가 회원 탈퇴하면 opponentId 가 없다(서버가 「알 수 없는 사용자」로 준다).
// 대상이 없으니 신고·차단을 아예 안 그린다 — 눌리는데 반드시 실패하는 것보다 정직하다.
// ⚠️ 「방을 나간」 것과 「회원 탈퇴」는 다르다. 나간 상대는 opponentId 가 그대로 있고,
//    그때는 신고·차단이 되어야 한다 — 사기를 당하고 상대가 도망친 경우가 그렇다.
const canReportOrBlock = data.opponentId != null

const menuItems = [
  { label: '판매완료 처리', onClick: handleTradeStatusChange },
  ...(canReportOrBlock
    ? [
        { label: '신고하기', onClick: () => { setIsMenuOpen(false); setIsReportOpen(true) }, className: 'text-danger-500' },
        { label: '차단하기', onClick: () => { setIsMenuOpen(false); setIsBlockOpen(true) }, className: 'text-danger-500' },
      ]
    : []),
  { label: '채팅방 나가기', onClick: () => { setIsMenuOpen(false); setIsLeaveOpen(true) }, className: 'text-danger-500' },
]
```

- [ ] **단계 4: 남은 `alert` 을 토스트로 바꾼다 (⑨)**

`handleTradeStatusChange` 의 오류 처리가 남아 있다. `console.error` 만 하고 사용자에게 아무 말도
안 하는데, 토스트로 알린다.

```tsx
import { useToastStore } from '@/store/toastStore'
```

⚠️ `toastStore` 의 실제 이름·모양을 열어서 확인하고 맞춘다. 지어내지 않는다.

- [ ] **단계 5: 눈으로 본다**

```
신고하기 → 사유를 고르는 모달이 뜬다 (일곱 개)
차단하기 → 「정말로 …를 차단하시겠습니까?」 + 주의사항
상대가 나간 방 → 신고·차단이 그대로 보인다
「알 수 없는 사용자」 방 → 신고·차단이 안 보인다
```

- [ ] **단계 6: 게이트 · 커밋**

```bash
pnpm gate
git commit -m "refactor(web): 채팅방 차단·신고를 공용 모달로 바꾼다 (#875)"
```

---

### 과제 4: 차단이 채팅을 실제로 막는다 (①②③)

**여기만 백엔드가 붙는다.** 지금 `USER_BLOCK_ALERT_LIST` 첫 줄이 지키지 못할 약속이다 —
「차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다」인데 **채팅 서비스가 차단을 안 본다**
(`ChatServiceImpl` 에 `UserBlock` 이 0곳).

**파일 (백엔드 `~/Desktop/cmarket_api`)**
- 고친다: `.../chat/app/service/ChatServiceImpl.java` — 보내기 · 목록 · 메시지 조회
- 고친다: `.../chat/app/dto/ChatRoomListItemDto.java` · `.../web/chat/dto/ChatRoomListItemResponse.java`
- 고친다: `.../chat/app/dto/ChatMessageListDto.java` · `.../web/chat/dto/ChatMessageListResponse.java`
  ← **앱 몫**. 앱 채팅방은 방 정보를 안 가져오고 메시지만 조회한다

**파일 (웹)**
- 고친다: `src/graphql/schema.ts` · `src/graphql/resolvers.ts` — `isOpponentBlocked` 통과
- 고친다: `src/features/chatting-page/ChattingPage.tsx` — 조회 필드 · 입력창 잠금

**파일 (앱)**
- 고친다: `mobile/lib/chat/api.ts` — `fetchChatMessages` 가 `isOpponentBlocked` 도 돌려준다
- 고친다: `mobile/lib/chat/api.test.ts`
- 고친다: `mobile/app/chat/[id].tsx` — 입력창 잠금 · 안내

- [ ] **단계 1: 보낼 때 막는다**

`ChatServiceImpl.sendMessage` 의 개인정보 필터 옆에 차단 확인을 더한다.

```java
// 차단한 사이면 상대에게 보내지 않는다.
// ⚠️ **차단당한 쪽에는 알리지 않는다** — 자기 화면에는 보낸 메시지가 그대로 보이고
//    상대에게만 안 간다(카카오톡·당근이 같다). 차단 사실이 드러나면 보복을 부른다.
// 어느 쪽이 차단했든 그 방에서는 오가지 않는다.
boolean blockedBetween = opponent != null && (
        userBlockRepository.existsByBlockerIdAndBlockedUserId(opponent.getUserId(), senderId)
     || userBlockRepository.existsByBlockerIdAndBlockedUserId(senderId, opponent.getUserId()));
```

`blockedBetween` 이면 **개인정보 차단과 같은 길**로 보낸다 — 발신자에게만
(`/user/queue/chat`), 안 읽은 수도 안 올리고 알림도 안 만든다.

⚠️ **`isBlocked` 플래그를 세우면 안 된다.** 그건 「개인정보 포함으로 전송되지 않았습니다」
문구를 띄우는 값이라, 차단 사실이 엉뚱한 이유로 드러난다.

- [ ] **단계 2: 조회할 때도 거른다**

`getChatMessages` 에 이미 차단 메시지를 거르는 자리가 있다(`ChatServiceImpl:387~396`).
그 옆에 **내가 차단한 사람이 보낸 메시지**도 거른다. 안 그러면 방을 다시 열 때 다 보인다.

- [ ] **단계 3: 차단 여부를 두 응답에 실어 보낸다**

값은 둘 다 `existsByBlockerIdAndBlockedUserId(나, 상대)` 다 — **내가 차단했는지**만 본다.
차단당한 쪽에는 알리지 않기로 했으니 반대 방향은 안 싣는다.

```
ChatRoomListItemDto · ChatRoomListItemResponse    ← 웹. 채팅 목록을 이미 들고 있다
ChatMessageListDto · ChatMessageListResponse      ← 앱. 방 정보를 안 가져오고 메시지만 조회한다
```

⚠️ **왜 둘이나 되나** — 웹의 채팅 화면은 목록과 방이 한 화면이라 목록에서 읽으면 되는데,
앱의 채팅방은 루트 화면이라 방 번호만 들고 들어온다. 각자 자기가 이미 부르는 응답에서 읽는 게
요청을 더 안 늘리는 길이다.

- [ ] **단계 4: 백엔드 커밋 · 푸시**

```bash
cd ~/Desktop/cmarket_api && git add -A
git commit -m "feat: 차단한 사이에서는 채팅이 오가지 않는다 (#875)"
```

⚠️ 컴파일을 못 해보니 **부르는 이름·타입을 하나씩 대조**한다. 푸시 뒤 사용자가 EC2에서 빌드한다.

- [ ] **단계 5: GraphQL 로 필드를 통과시킨다**

`schema.ts` 의 `ChatRoom` 에 `isOpponentBlocked: Boolean`, `resolvers.ts` 가 그대로 넘기게 한다.
⚠️ **조회 쿼리에도 필드를 더해야 한다** — 안 더하면 늘 `undefined` 라 조용히 안 잠긴다.

- [ ] **단계 6: 입력창을 잠근다 (②③)**

`ChattingPage.tsx` 에서 `selectedRoom.isOpponentBlocked` 면 입력칸과 보내기·사진 단추를 막고
그 자리에 안내를 그린다.

```
차단한 사용자입니다. 차단을 해제하면 다시 대화할 수 있어요.
```

**방은 그대로 남는다**(②) — 대화 기록은 지킨다. **차단 직후에도 방에 남는다**(③).

⚠️ `BlockModal` 이 성공하면 `['userPage']` 만 무효화한다. **`['chatRooms']` 도 무효화**해야
입력창이 바로 잠긴다. `BlockModal` 을 고치기보다 채팅 화면이 자기 것을 다시 부르는 쪽이 안전하다
— `BlockModal` 은 다른 화면 셋이 쓰고 있다.

- [ ] **단계 7: 앱도 입력창을 잠근다**

`mobile/lib/chat/api.ts` 의 `fetchChatMessages` 가 `isOpponentBlocked` 도 돌려주게 한다
(없으면 `false`). 시험도 함께 고친다 — DTO 모양대로 가짜 응답을 넣는다.

`mobile/app/chat/[id].tsx` 는 그 값을 상태로 들고, 참이면 입력창을 잠그고 안내를 그린다.
**「연결 중이에요…」 띠와 같은 자리**를 쓰면 새로 만들 게 없다.

```tsx
// 차단한 방은 글을 못 쓴다. 방과 대화 기록은 그대로 둔다 — 거래 이야기가 오갔을 수 있다.
// ⚠️ 상대에게는 차단 사실을 안 알린다(서버가 조용히 막는다). 그래서 이 안내는
//    **차단한 본인에게만** 보인다.
{isOpponentBlocked ? (
  <View style={styles.banner}>
    <Text style={styles.bannerText}>차단한 사용자입니다. 차단을 해제하면 다시 대화할 수 있어요.</Text>
  </View>
) : null}
```

⚠️ 문구는 **웹과 한 글자도 다르지 않게** 한다.
⚠️ `ChatInput` 은 이미 `disabled` 를 받는다 — `disabled={!connected || isOpponentBlocked}` 로 묶는다.

- [ ] **단계 8: 두 계정으로 눈으로 본다 (웹·앱 둘 다)**

```
A가 B를 차단한다 → A의 입력창이 잠긴다 · 안내가 보인다 · 방은 그대로 있다   (웹·앱)
B가 메시지를 보낸다 → B 화면에는 보인다 · A에게는 안 온다 · 알림도 안 온다
A가 방을 다시 연다 → B가 차단 뒤 보낸 메시지가 안 보인다
A가 차단을 푼다 → 다시 대화가 된다
```

⚠️ 앱에서 차단은 **상품 상세나 프로필**에서 한다 — 앱 채팅방에는 메뉴가 없다.

- [ ] **단계 9: 게이트 · 커밋**

```bash
pnpm gate && pnpm gate:mobile
git commit -m "feat(web·app): 차단한 방은 입력창을 잠근다 (#875)"
```

---

### 과제 5: 알림 목록에 채팅 개수 뱃지 (#874)

백엔드와 앱은 끝났다. **웹만 남았다.**

**파일**
- 고친다: `src/graphql/schema.ts` · `src/graphql/resolvers.ts` — `groupCount` 통과
- 고친다: `src/components/header/components/notification-section/NotificationsDropdown.tsx` — 조회 필드
- 고친다: `src/components/header/components/notification-section/NotificationItem.tsx` — 점/숫자
- 살핀다: `src/components/header/components/MobileNotificationsOverlay.tsx` · `src/app/(main)/notifications/page.tsx`

- [ ] **단계 1: 필드를 통과시킨다**

⚠️ **`NotificationsDropdown.tsx:45` 의 조회 필드에 `groupCount` 를 더해야 한다.**
안 더하면 값이 늘 `undefined` 라 **조용히 점만 나온다.** 다른 알림 조회처도 함께 찾아 더한다.

```bash
grep -rn "notificationId notificationType" src --include="*.tsx"
```

- [ ] **단계 2: 규칙대로 그린다**

앱과 **같은 규칙**이다(`mobile/lib/notifications.ts` 의 `resolveUnreadMark`).

```
읽음                     아무것도 안 그린다
안 읽음 · groupCount ≥ 2  숫자 뱃지 (99 넘으면 99+)
그 밖에 안 읽음            지금처럼 점
```

`NotificationItem.tsx:37` 의 점을 그리는 자리를 가른다.

- [ ] **단계 3: 색을 고른다**

⚠️ **점 색을 그대로 뱃지에 쓰지 말 것.** 앱에서 재보니 점 색(`#B06F15`)은 흰 글자 대비가
**4.09:1** 이라 작은 글자를 못 읽는다. 앱은 `#825500`(6.46:1)을 썼다.
웹 토큰에서 같은 값을 찾아 쓴다 — 없으면 앱과 같은 값을 토큰으로 더한다.

- [ ] **단계 4: 세 곳이 다 되는지 본다**

드롭다운 · 모바일 오버레이 · 알림 전체 화면. **같은 조각을 쓰는지 먼저 확인**하고,
안 쓰면 각각 고친다.

- [ ] **단계 5: 게이트 · 커밋**

```bash
pnpm gate
git commit -m "feat(web): 알림 줄에 묶인 채팅 개수를 뱃지로 (#874)"
```

---

## 이 계획이 안 하는 것

```
신고 뒤 차단 권하기        ⑤에서 안 하기로 정했다
앱 채팅방의 신고·차단      앱에는 더보기 메뉴 자체가 없다 — 별도 바퀴
                          (입력창 잠금은 이번에 한다 — 과제 4)
판매완료 처리 확인창       되돌릴 수 있어 급하지 않다
앱 채팅방 헤더의 상대 이름  지금은 「채팅」이라고만 쓴다. 별도 바퀴
```

## 관련

- #872 말풍선 최대 너비 · #874 알림 개수 뱃지 · #875 확인창 없음
- 앱 쪽 구현: `mobile/components/chat/message-bubble.tsx` · `mobile/lib/notifications.ts` (#871)
- 백엔드 규칙·함정: 저장소 루트 `CLAUDE.md` 「백엔드 저장소」
