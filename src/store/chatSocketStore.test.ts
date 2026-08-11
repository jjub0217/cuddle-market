import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 끊겼다 다시 붙는 일은 늘 있다 — 지하철·와이파이 전환·탭을 오래 열어 둘 때.
 * 그때 방 구독이 안 살아나면 **보내기는 되는데 그 방만 조용히 죽는다**(#884).
 *
 * 앱에서 같은 버그를 먼저 고쳤다(#882). 여기 시험은 그때 쓴 것과 같은 방식이다 —
 * 가짜 Client 를 두고 붙기·끊기를 손으로 시킨다.
 */

/** 만들어진 가짜 Client 들. 시험에서 붙기·끊기를 시키려고 들고 있는다. */
const clients: FakeClient[] = []

interface FakeSubscription {
  destination: string
  unsubscribe: () => void
}

class FakeClient {
  config: Record<string, () => void>
  active = false
  connected = false
  subscriptions: FakeSubscription[] = []

  constructor(config: Record<string, () => void>) {
    this.config = config
    clients.push(this)
  }

  activate() {
    this.active = true
  }

  deactivate() {
    this.active = false
    this.connected = false
  }

  subscribe(destination: string) {
    const subscription = { destination, unsubscribe: vi.fn() }
    this.subscriptions.push(subscription)
    return subscription
  }

  publish() {}

  /** 서버가 CONNECTED 를 보낸 것으로 친다. */
  open() {
    this.connected = true
    this.config.onConnect?.()
  }

  /**
   * 줄이 뚝 끊긴 것으로 친다.
   *
   * 실제로도 그렇듯 **걸려 있던 구독은 연결과 함께 사라진다.** 그리고 이때는
   * onDisconnect 가 아니라 onWebSocketClose 만 온다 — 그게 이 버그의 뿌리였다.
   */
  drop() {
    this.connected = false
    this.subscriptions = []
    this.config.onWebSocketClose?.()
  }
}

vi.mock('sockjs-client', () => ({ default: vi.fn(() => ({})) }))
vi.mock('@stomp/stompjs', () => ({ Client: FakeClient }))

const { chatSocketStore } = await import('./chatSocketStore')

const roomTopics = (client: FakeClient) =>
  client.subscriptions.filter((s) => s.destination.startsWith('/topic/chat/'))

beforeEach(() => {
  clients.length = 0
  chatSocketStore.setState({
    socket: null,
    messages: {},
    currentRoomId: null,
    subscriptions: {},
    isConnected: false,
    chatRoomUpdates: {},
    connectionError: null,
  })
})

describe('끊겼다 다시 붙기', () => {
  it('다시 붙으면 보고 있던 방을 다시 구독한다', () => {
    chatSocketStore.getState().connect('ws://test', 'token')
    const client = clients[0]
    client.open()

    chatSocketStore.getState().subscribeToRoom(16)
    expect(roomTopics(client)).toHaveLength(1)

    client.drop()
    client.open()

    // 다시 걸리지 않으면 이 방의 새 메시지가 영영 안 온다.
    expect(roomTopics(client)).toEqual([expect.objectContaining({ destination: '/topic/chat/16' })])
  })

  it('끊기면 안 붙은 것으로 보고 구독 기록도 비운다', () => {
    chatSocketStore.getState().connect('ws://test', 'token')
    const client = clients[0]
    client.open()
    chatSocketStore.getState().subscribeToRoom(16)

    expect(chatSocketStore.getState().isConnected).toBe(true)

    client.drop()

    // 이 둘이 안 되면 다시 붙어도 화면이 「계속 붙어 있었다」고 여긴다.
    expect(chatSocketStore.getState().isConnected).toBe(false)
    expect(chatSocketStore.getState().subscriptions).toEqual({})
  })

  it('방에 들어간 적이 없으면 다시 붙어도 방을 구독하지 않는다', () => {
    chatSocketStore.getState().connect('ws://test', 'token')
    const client = clients[0]
    client.open()

    client.drop()
    client.open()

    expect(roomTopics(client)).toHaveLength(0)
  })
})
