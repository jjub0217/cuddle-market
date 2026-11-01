import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestPayment = vi.fn()
vi.mock('@tosspayments/tosspayments-sdk', () => ({
  ANONYMOUS: '@@ANONYMOUS',
  loadTossPayments: vi.fn(async () => ({ payment: () => ({ requestPayment }) })),
}))

describe('startCardPayment', () => {
  beforeEach(() => {
    requestPayment.mockReset()
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_TOSS_CLIENT_KEY', 'test_ck_dummy')
  })

  it('테스트 결제라 카드사 인증을 건너뛰는 sandbox 성공 옵션을 늘 켠다', async () => {
    // 카드사 화면은 실제 휴대폰 번호·주민번호를 요구한다. 테스터가 개인정보를 넣지 않게 한다(2026-11-01 사용자 결정)
    const { startCardPayment } = await import('./toss')

    await startCardPayment({ orderId: 'CM1', amount: 50000, orderName: '신발' })

    expect(requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'CARD',
        amount: { currency: 'KRW', value: 50000 },
        orderId: 'CM1',
        sandbox: { paymentResult: 'SUCCESS' },
      })
    )
  })
})
