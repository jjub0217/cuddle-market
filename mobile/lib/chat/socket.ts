import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs';

import { apiBaseUrl } from '../auth/api';
import { useAuthStore } from '../auth/store';

/**
 * 채팅 소켓 하나.
 *
 * **쓰는 화면을 센다.** 목록과 방이 각자 `acquire()` 로 잡고 `release()` 로 놓는다.
 * 잡은 곳이 0이 되면 끊는다. 왜 이렇게 하나 — 방은 루트 화면이라 탭 바깥이고,
 * 상품 상세·알림에서 **탭을 안 거치고** 바로 들어온다. 「탭에 있는 동안」으로 묶으면
 * 그 길로 들어온 방은 소켓 없이 열린다.
 *
 * ⚠️ 화면 전환은 겹친다 — 새 화면이 뜨고 나서 옛 화면이 사라진다. 방에서 뒤로 갈 때
 * 잠깐 0이 스칠 수 있어 **끊기를 몇 초 늦춘다.** 안 그러면 끊었다 바로 다시 붙는다.
 */

/** 방에서 목록으로 돌아갈 때 0이 스치는 것을 넘기는 시간. */
const RELEASE_DELAY_MS = 3000;

interface ClientLike {
  active: boolean;
  connected: boolean;
  activate(): void;
  deactivate(): void;
  subscribe(destination: string, cb: (message: { body: string }) => void): { unsubscribe(): void };
  publish(params: { destination: string; body: string }): void;
}

interface Deps {
  makeClient: (opts: {
    onConnect: (frame: IFrame) => void;
    /** 연결이 끊겼을 때. 다시 붙는 것은 stompjs 가 알아서 한다(reconnectDelay). */
    onDisconnect: () => void;
  }) => ClientLike;
  releaseDelayMs: number;
}

export interface ChatSocket {
  acquire(): void;
  release(): void;
  /** 되돌려주는 함수를 부르면 구독을 푼다. */
  subscribe(destination: string, cb: (body: unknown) => void): () => void;
  /** 안 붙어 있으면 보내지 않고 false 를 준다. */
  publish(destination: string, body: unknown): boolean;
  isConnected(): boolean;
}

/**
 * 구독 하나.
 *
 * ⚠️ **목적지로 묶지 않고 건 것마다 따로 들고 있는다.** 같은 목적지를 둘이 구독하는 일이
 * 실제로 있다 — 방 A 에서 방 B 로 갈 때 화면이 겹치는 동안 둘 다 `/user/queue/chat` 을
 * 듣는다. 목적지로 묶어 두면 A 가 정리되면서 **B 의 구독까지 끊긴다.** 그러면 B 는
 * 새 메시지를 조용히 못 받는다 — 오류도 안 난다.
 */
interface Entry {
  destination: string;
  cb: (body: unknown) => void;
  /** 아직 안 붙어서 못 건 것은 null. 붙으면 채운다. */
  sub: { unsubscribe(): void } | null;
}

export function createChatSocket(deps: Deps): ChatSocket {
  let client: ClientLike | null = null;
  let users = 0;
  let connected = false;
  let releaseTimer: ReturnType<typeof setTimeout> | null = null;
  /** 건 구독 전부. 아직 안 걸린 것(`sub === null`)은 붙을 때 건다. */
  const entries = new Set<Entry>();

  const bind = (entry: Entry) => {
    if (!client) return;
    entry.sub = client.subscribe(entry.destination, (message) => {
      try {
        entry.cb(JSON.parse(message.body));
      } catch {
        // 본문이 JSON 이 아니면 버린다. 서버는 늘 JSON 을 보낸다.
      }
    });
  };

  return {
    acquire() {
      users += 1;
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      if (client) return;

      client = deps.makeClient({
        onConnect: () => {
          connected = true;
          // 걸어 둔 것을 **전부** 다시 건다.
          //
          // ⚠️ 「아직 안 걸린 것만」 걸면 다시 붙었을 때 아무것도 안 온다. 끊겼다 붙으면
          //    예전 sub 은 **죽은 연결에 걸린 껍데기**인데 null 이 아니라 건너뛰기 때문이다.
          //    stompjs 는 다시 붙어도 구독을 살려주지 않는다 — 우리가 다시 걸어야 한다.
          //    보내기는 새 연결로 잘 나가서 **오류도 없이 받기만 조용히 멈춘다**(#882).
          //
          //    CONNECTED 프레임은 새 연결에서만 오므로, 여기서는 예전 sub 이 늘 죽어 있다.
          //    풀 필요 없이 덮어쓰면 된다 — 서버 쪽 구독은 연결과 함께 사라졌다.
          entries.forEach((entry) => bind(entry));
        },
        onDisconnect: () => {
          connected = false;
          // 죽은 구독은 못 쓴다. 비워 두면 다시 붙을 때 새로 건다.
          entries.forEach((entry) => {
            entry.sub = null;
          });
        },
      });
      client.activate();
    },

    release() {
      users = Math.max(0, users - 1);
      if (users > 0) return;

      const close = () => {
        releaseTimer = null;
        if (users > 0) return;
        client?.deactivate();
        client = null;
        connected = false;
        entries.clear();
      };

      if (deps.releaseDelayMs <= 0) {
        close();
        return;
      }
      releaseTimer = setTimeout(close, deps.releaseDelayMs);
    },

    subscribe(destination, cb) {
      const entry: Entry = { destination, cb, sub: null };
      entries.add(entry);
      if (connected) bind(entry);

      return () => {
        // 자기 것만 푼다. 두 번 불러도, 이미 끊긴 뒤에 불러도 탈이 없다.
        if (!entries.delete(entry)) return;
        entry.sub?.unsubscribe();
        entry.sub = null;
      };
    },

    publish(destination, body) {
      if (!client || !connected) return false;
      client.publish({ destination, body: JSON.stringify(body) });
      return true;
    },

    isConnected() {
      return connected;
    },
  };
}

/** API 주소에서 WebSocket 주소를 만든다. `https://…/api` → `wss://…/ws-stomp` */
export function chatSocketUrl(): string {
  return apiBaseUrl().replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws-stomp';
}

/** 앱이 실제로 쓰는 하나. */
export const chatSocket = createChatSocket({
  makeClient: ({ onConnect, onDisconnect }) =>
    new Client({
      // ⚠️ brokerURL 이 아니라 webSocketFactory 다. RN 전역의 WebSocket 을 쓴다.
      webSocketFactory: () => new WebSocket(chatSocketUrl()),
      // 토큰은 **붙을 때마다** 새로 읽는다. 만들 때 한 번 박아 두면, 로그인 전에
      // 만들어진 클라이언트가 빈 토큰을 계속 쓴다.
      // stompjs 는 이 함수를 `this.beforeConnect(this)` 로 부른다 — 인자가 클라이언트다.
      beforeConnect: (client) => {
        const token = useAuthStore.getState().accessToken;
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      reconnectDelay: 5000,
      // ⚠️ 이 두 줄을 빼면 서버가 오류도 로그도 없이 침묵한다.
      //    RN 의 WebSocket 이 STOMP 프레임 끝의 NULL 문자를 흘리기 때문이다.
      //    20바퀴에 이걸 못 찾아 하루를 썼다 — mobile/AGENTS.md 함정 표 참고.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect,
      // ⚠️ **소켓이 닫힌 것을 여기서만 알 수 있다.** 이걸 안 달면 끊겨도 connected 가
      //    참으로 남아, 화면에 「연결 중이에요…」 띠가 안 뜨고 publish 도 참을 돌려줘
      //    보내기 실패가 조용히 지나간다(#882).
      onWebSocketClose: onDisconnect,
    }) as unknown as ClientLike,
  releaseDelayMs: RELEASE_DELAY_MS,
});

export type { StompSubscription };
