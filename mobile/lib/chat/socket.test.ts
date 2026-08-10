jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { createChatSocket } from './socket';

/**
 * @stomp/stompjs 의 Client 흉내. 붙기·끊기를 우리가 손으로 시킨다.
 *
 * 건 구독을 하나씩 들고 있다가 `deliver` 로 흘려보낸다. 구독마다 **다른**
 * `unsubscribe` 를 돌려줘야 「누구 것이 풀렸는지」를 가릴 수 있다.
 */
function fakeClient() {
  const client: any = {
    active: false,
    connected: false,
    /** 지금 살아 있는 구독. 푼 것은 여기서 빠진다. */
    handlers: [] as any[],
    activate: jest.fn(() => {
      client.active = true;
    }),
    deactivate: jest.fn(() => {
      client.active = false;
      client.connected = false;
    }),
    subscribe: jest.fn((destination: string, cb: (m: { body: string }) => void) => {
      const handler = {
        destination,
        cb,
        unsubscribe: jest.fn(() => {
          client.handlers = client.handlers.filter((h: any) => h !== handler);
        }),
      };
      client.handlers.push(handler);
      return { unsubscribe: handler.unsubscribe };
    }),
    publish: jest.fn(),
  };
  return client;
}

function make() {
  const client = fakeClient();
  const socket = createChatSocket({
    makeClient: (opts: any) => {
      client.onConnect = opts.onConnect;
      return client;
    },
    // 끊기를 늦추는 시간. 시험에서는 0으로 둬서 바로 끊기게 한다.
    releaseDelayMs: 0,
  });
  /** 서버가 CONNECTED 를 보낸 것으로 친다. */
  const connect = () => {
    client.connected = true;
    client.onConnect({ headers: {} });
  };
  /** 서버가 그 목적지로 메시지를 보낸 것으로 친다. */
  const deliver = (destination: string, payload: unknown) => {
    client.handlers
      .filter((h: any) => h.destination === destination)
      .forEach((h: any) => h.cb({ body: JSON.stringify(payload) }));
  };
  return { client, socket, connect, deliver };
}

describe('쓰는 화면 세기', () => {
  it('처음 하나가 잡으면 붙는다', () => {
    const { client, socket } = make();
    socket.acquire();
    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it('둘째가 잡아도 다시 붙지 않는다', () => {
    const { client, socket } = make();
    socket.acquire();
    socket.acquire();
    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it('하나가 놓아도 남아 있으면 안 끊는다', () => {
    const { client, socket } = make();
    socket.acquire();
    socket.acquire();
    socket.release();
    expect(client.deactivate).not.toHaveBeenCalled();
  });

  it('마지막이 놓으면 끊는다', () => {
    const { client, socket } = make();
    socket.acquire();
    socket.release();
    expect(client.deactivate).toHaveBeenCalledTimes(1);
  });
});

describe('구독', () => {
  // CONNECTED 전에 구독하면 조용히 버려진다. 그래서 붙을 때까지 들고 있는다.
  it('붙기 전에 건 구독은 붙은 뒤에 걸린다', () => {
    const { client, socket, connect } = make();
    socket.acquire();
    socket.subscribe('/user/queue/chat', jest.fn());

    expect(client.subscribe).not.toHaveBeenCalled();

    connect();
    expect(client.subscribe).toHaveBeenCalledWith('/user/queue/chat', expect.any(Function));
  });

  it('이미 붙어 있으면 바로 걸린다', () => {
    const { client, socket, connect } = make();
    socket.acquire();
    connect();
    socket.subscribe('/user/queue/chat', jest.fn());
    expect(client.subscribe).toHaveBeenCalledTimes(1);
  });
});

describe('구독 해제는 자기 것만 푼다', () => {
  // 방 A 에서 방 B 로 갈 때 잠깐 둘 다 살아 있고, 둘 다 같은 목적지를 구독한다.
  // 그때 A 가 정리되면서 B 의 구독까지 끊기면 B 는 새 메시지를 조용히 못 받는다.
  it('같은 목적지에 둘이 걸어도 하나를 풀면 남은 하나는 살아 있다', () => {
    const { socket, connect, deliver } = make();
    socket.acquire();
    connect();

    const a = jest.fn();
    const b = jest.fn();
    const offA = socket.subscribe('/user/queue/chat', a);
    socket.subscribe('/user/queue/chat', b);

    offA();
    deliver('/user/queue/chat', { id: 1 });

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith({ id: 1 });
  });

  it('붙기 전에 둘이 걸어도 하나를 풀면 남은 하나만 걸린다', () => {
    const { socket, connect, deliver } = make();
    socket.acquire();

    const a = jest.fn();
    const b = jest.fn();
    const offA = socket.subscribe('/user/queue/chat', a);
    socket.subscribe('/user/queue/chat', b);

    offA();
    connect();
    deliver('/user/queue/chat', { id: 2 });

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith({ id: 2 });
  });

  // 같은 함수를 두 번 걸 수도 있다. 「목적지와 함수가 같은 것」을 지우는 식이면
  // 한 번 풀었을 뿐인데 둘 다 사라진다.
  it('같은 함수로 두 번 걸어도 한 번 풀면 하나만 사라진다', () => {
    const { socket, connect, deliver } = make();
    socket.acquire();

    const cb = jest.fn();
    const off1 = socket.subscribe('/user/queue/chat', cb);
    socket.subscribe('/user/queue/chat', cb);

    off1();
    connect();
    deliver('/user/queue/chat', { id: 3 });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('해제를 두 번 불러도 남의 것을 건드리지 않는다', () => {
    const { socket, connect, deliver } = make();
    socket.acquire();
    connect();

    const a = jest.fn();
    const b = jest.fn();
    const offA = socket.subscribe('/user/queue/chat', a);
    socket.subscribe('/user/queue/chat', b);

    offA();
    offA();
    deliver('/user/queue/chat', { id: 4 });

    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe('보내기', () => {
  it('안 붙어 있으면 보내지 않고 false 를 준다', () => {
    const { client, socket } = make();
    socket.acquire();
    expect(socket.publish('/app/chat/message', { a: 1 })).toBe(false);
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('붙어 있으면 보낸다', () => {
    const { client, socket, connect } = make();
    socket.acquire();
    connect();
    expect(socket.publish('/app/chat/message', { a: 1 })).toBe(true);
    expect(client.publish).toHaveBeenCalledWith({
      destination: '/app/chat/message',
      body: JSON.stringify({ a: 1 }),
    });
  });
});
