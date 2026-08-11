import { fetchGraphQL } from './graphql'

/**
 * 알림 하나를 읽음으로 만든다. **실패해도 조용히 지나간다.**
 *
 * 이건 「덤으로 하는 일」이다 — 누른 순간 화면은 이미 뱃지를 줄이고 갈 곳으로 옮겨 간다.
 * 여기서 던지면 그 뒤의 목록 새로고침이 통째로 안 돌고, 콘솔에는 잡히지 않은 오류가 남는다.
 *
 * ⚠️ **정상적으로 쓰다가도 404 가 난다**(#881). 두 갈래다.
 *
 *   ① 채팅 알림은 한 방에 하나로 묶는데(#873), 갱신이 아니라 **지우고 새로 만든다.**
 *      목록을 열어 둔 사이에 새 메시지가 오면 화면이 든 번호는 서버에 없다.
 *   ② 이미 읽은 알림을 다시 누르면 서버가 「없음」으로 친다.
 *      ← 이쪽은 서버를 고쳐 성공으로 돌려주게 했다(2026-08-11 배포).
 *
 * ①은 남는다. 없어진 알림을 못 지운다고 사용자에게 알릴 일은 아니라서 여기서 삼킨다.
 */
export const markNotificationRead = async (notificationId: number): Promise<void> => {
  try {
    await fetchGraphQL(
      `
      mutation MarkNotificationRead($notificationId: Int!) {
        markNotificationRead(notificationId: $notificationId) { success }
      }
    `,
      { notificationId }
    )
  } catch {
    // 삼킨다. 위 주석의 ①이 여기로 온다.
  }
}
