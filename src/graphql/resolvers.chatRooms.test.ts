import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolvers } from './resolvers'

// 채팅방 상태와 결제 가능 여부(#1126). 서버가 아직 안 주는 동안에도 화면이 undefined 를 받지 않게 한다.
function stubRooms(rooms: Record<string, unknown>[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { chatRooms: rooms } }) })
  )
}

describe('chatRooms 리졸버', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('서버가 준 roomState 와 canPay 를 그대로 넘긴다', async () => {
    stubRooms([{ chatRoomId: 1, roomState: 'PAUSED_RESERVED', canPay: false }, { chatRoomId: 2, roomState: 'OPEN', canPay: true }])

    const result = await resolvers.Query.chatRooms(null, { page: 0, size: 20 }, { authorization: '' })

    expect(result.chatRooms.map((r: { roomState: string; canPay: boolean }) => [r.roomState, r.canPay])).toEqual([
      ['PAUSED_RESERVED', false],
      ['OPEN', true],
    ])
  })

  it('서버가 안 주면 열림·결제 불가로 본다', async () => {
    stubRooms([{ chatRoomId: 1 }])

    const result = await resolvers.Query.chatRooms(null, { page: 0, size: 20 }, { authorization: '' })

    expect(result.chatRooms[0]).toMatchObject({ roomState: 'OPEN', canPay: false })
  })
})
