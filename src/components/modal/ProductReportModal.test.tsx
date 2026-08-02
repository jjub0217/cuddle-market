import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render, screen } from '@/test/render'

import ProductReportModal from './ProductReportModal'

// 상품 신고. 배포된 웹에서 500이 나 신고가 아예 접수되지 않던 것 (#808).
//
// 원인은 보내는 형식이었다 — 서버는 @RequestBody(JSON)인데 웹이 FormData로 보냈다.
// 그래서 이 시험의 알맹이는 「무엇을 어떤 모양으로 보내는가」다.

vi.mock('@/lib/api/api', () => ({
  api: { post: vi.fn() },
}))

const { api } = vi.mocked(await import('@/lib/api/api'), true)

/** 서버가 「이미 신고했다」고 답한 것. ErrorCode.ALREADY_REPORTED는 409다 */
function alreadyReportedError() {
  return new AxiosError(
    'Request failed with status code 409',
    'ERR_BAD_REQUEST',
    { headers: new AxiosHeaders() },
    null,
    {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
      // 핸들러가 targetName을 버리고 ErrorCode 문구만 준다
      data: { message: '이미 신고된 대상입니다.' },
    }
  )
}

async function submitReport() {
  const user = userEvent.setup()
  render(<ProductReportModal isOpen productId={58} productTitle="캣타워" onCancel={vi.fn()} />)

  // 사유를 하나 고르고 제출한다. 사유를 안 고르면 제출 단추가 안 눌린다.
  await user.click(screen.getByLabelText('허위/사기성 상품'))
  await user.click(screen.getByRole('button', { name: '신고하기' }))

  return user
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('보내는 모양', () => {
  it('FormData가 아니라 JSON으로 보낸다', async () => {
    api.post.mockResolvedValue({ data: {} })

    await submitReport()

    expect(api.post).toHaveBeenCalledTimes(1)
    const [path, body] = api.post.mock.calls[0]

    expect(path).toBe('/reports/products/58')
    // FormData로 보내면 서버가 @RequestBody를 못 읽어 500이 난다
    expect(body).not.toBeInstanceOf(FormData)
    expect(body).toEqual({ reasonCodes: ['FALSE_OR_SCAM'] })
  })

  it('사유를 배열로 감싼다', async () => {
    api.post.mockResolvedValue({ data: {} })

    await submitReport()

    const [, body] = api.post.mock.calls[0]
    // ⚠️ 상품만 reasonCodes(배열)다. 사용자·게시글은 reasonCode(문자열)다
    expect((body as { reasonCodes: string[] }).reasonCodes).toEqual(['FALSE_OR_SCAM'])
  })

  it('상세 사유를 안 썼으면 아예 안 보낸다', async () => {
    api.post.mockResolvedValue({ data: {} })

    await submitReport()

    const [, body] = api.post.mock.calls[0]
    expect(body).not.toHaveProperty('detailReason')
    expect(body).not.toHaveProperty('imageUrls')
  })

  it('상세 사유를 썼으면 같이 보낸다', async () => {
    api.post.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<ProductReportModal isOpen productId={58} productTitle="캣타워" onCancel={vi.fn()} />)

    await user.click(screen.getByLabelText('허위/사기성 상품'))
    await user.type(screen.getByRole('textbox'), '사진이 다른 상품이에요')
    await user.click(screen.getByRole('button', { name: '신고하기' }))

    const [, body] = api.post.mock.calls[0]
    expect(body).toEqual({
      reasonCodes: ['FALSE_OR_SCAM'],
      detailReason: '사진이 다른 상품이에요',
    })
  })
})

describe('중복 신고', () => {
  it('409면 「이미 신고한 상품입니다」가 뜬다', async () => {
    api.post.mockRejectedValue(alreadyReportedError())

    await submitReport()

    // 예전에는 문구로 가려냈는데, 서버가 주는 문구가 「이미 신고된 대상입니다.」라
    // 「이미 신고된 상품」을 찾던 검사가 한 번도 안 맞았다
    expect(await screen.findByText('이미 신고한 상품입니다.')).toBeInTheDocument()
    expect(screen.queryByText('잠시 후 다시 시도해주세요.')).not.toBeInTheDocument()
  })

  it('다른 오류면 다시 시도하라고 한다', async () => {
    api.post.mockRejectedValue(new Error('네트워크가 끊겼어요'))

    await submitReport()

    expect(await screen.findByText('상품 신고에 실패했습니다.')).toBeInTheDocument()
    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('실패하면 창을 안 닫는다', async () => {
    const onCancel = vi.fn()
    api.post.mockRejectedValue(alreadyReportedError())
    const user = userEvent.setup()
    render(<ProductReportModal isOpen productId={58} productTitle="캣타워" onCancel={onCancel} />)

    await user.click(screen.getByLabelText('허위/사기성 상품'))
    await user.click(screen.getByRole('button', { name: '신고하기' }))

    await screen.findByText('이미 신고한 상품입니다.')
    // 고른 사유가 남아 있어야 다시 낼 수 있다
    expect(onCancel).not.toHaveBeenCalled()
  })
})
