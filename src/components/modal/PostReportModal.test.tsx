import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render, screen } from '@/test/render'

import PostReportModal from './PostReportModal'

// 게시글 신고. 「기타」를 고르면 조용히 실패하던 것 (#812).
//
// 웹 상수(POST_REPORT_REASON)의 「기타」가 OTHER였는데, 서버 CommunityReportReason
// 에는 그 값이 없다 — 게시글·상품은 ETC고 OTHER는 **사용자 신고**의 값이다.
// 그래서 이 시험의 알맹이는 「무슨 값을 보내는가」다. 화면 글자는 안 바뀐다.

vi.mock('@/lib/api/graphql', () => ({
  fetchGraphQL: vi.fn(),
}))

const { fetchGraphQL } = vi.mocked(await import('@/lib/api/graphql'), true)

/**
 * 서버가 「이미 신고했다」고 답한 것.
 *
 * 게시글 신고는 axios가 아니라 /api/graphql을 지나서, 409가 상태 코드가 아니라
 * 문구로 온다. 리졸버(resolvers.ts fetchAPI)가 `REST API error: 409`로 바꾸고
 * fetchGraphQL이 그걸 Error로 다시 던진다.
 */
function alreadyReportedError() {
  return new Error('REST API error: 409')
}

/** 사유를 하나 고르고 낸다. 사유를 안 고르면 제출 단추가 안 눌린다 */
async function submitReport(reasonLabel = '욕설, 비방, 혐오 표현') {
  const user = userEvent.setup()
  render(
    <PostReportModal
      isOpen
      postId={36}
      authorNickname="행복한집사"
      postTitle="강아지 산책 시간 어느 정도가 좋을까요?"
      onCancel={vi.fn()}
    />
  )

  await user.click(screen.getByLabelText(reasonLabel))
  await user.click(screen.getByRole('button', { name: '신고하기' }))

  return user
}

/** fetchGraphQL(query, variables)의 variables만 꺼낸다 */
function sentVariables() {
  const [, variables] = fetchGraphQL.mock.calls[0]
  return variables as { postId: number; reason: string; details?: string }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('보내는 사유 값', () => {
  it('「기타」를 고르면 ETC를 보낸다 (OTHER가 아니다)', async () => {
    fetchGraphQL.mockResolvedValue({})

    await submitReport('기타')

    expect(fetchGraphQL).toHaveBeenCalledTimes(1)
    // OTHER는 UserReportReason의 값이다. 게시글로 보내면 서버가 못 알아본다
    expect(sentVariables().reason).toBe('ETC')
    expect(sentVariables().reason).not.toBe('OTHER')
  })

  it('나머지 사유는 서버 enum 이름 그대로 보낸다', async () => {
    fetchGraphQL.mockResolvedValue({})

    await submitReport('자해 또는 자살 의도를 포함')

    expect(sentVariables()).toMatchObject({ postId: 36, reason: 'SELF_HARM_OR_SUICIDE' })
  })

  it('사유 여섯 개가 웹에 있던 문구·차례 그대로 보인다', () => {
    render(
      <PostReportModal
        isOpen
        postId={36}
        authorNickname="행복한집사"
        postTitle="강아지 산책 시간 어느 정도가 좋을까요?"
        onCancel={vi.fn()}
      />
    )

    // shared로 옮기면서 화면 글자는 하나도 안 바뀌어야 한다
    for (const label of [
      '욕설, 비방, 혐오 표현',
      '도배 게시물',
      '음란물/불건전 콘텐츠',
      '스팸/광고성 메시지',
      '자해 또는 자살 의도를 포함',
      '기타',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }

    // 보내는 값과 차례는 서버 enum과 맞아야 한다
    const values = screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).value)
    expect(values).toEqual([
      'ABUSE_OR_HATE',
      'REPETITIVE_POST',
      'INAPPROPRIATE_CONTENT',
      'SPAM_OR_AD',
      'SELF_HARM_OR_SUICIDE',
      'ETC',
    ])
  })
})

describe('중복 신고', () => {
  it('409면 「이미 신고한 게시글입니다」가 뜬다', async () => {
    fetchGraphQL.mockRejectedValue(alreadyReportedError())

    await submitReport()

    expect(await screen.findByText('이미 신고한 게시글입니다.')).toBeInTheDocument()
    expect(screen.queryByText('잠시 후 다시 시도해주세요.')).not.toBeInTheDocument()
  })

  it('다른 오류면 다시 시도하라고 한다', async () => {
    fetchGraphQL.mockRejectedValue(new Error('네트워크가 끊겼어요'))

    await submitReport()

    expect(await screen.findByText('게시글 신고에 실패했습니다.')).toBeInTheDocument()
    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('실패하면 창을 안 닫는다', async () => {
    const onCancel = vi.fn()
    fetchGraphQL.mockRejectedValue(alreadyReportedError())
    const user = userEvent.setup()
    render(
      <PostReportModal
        isOpen
        postId={36}
        authorNickname="행복한집사"
        postTitle="강아지 산책 시간 어느 정도가 좋을까요?"
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByLabelText('욕설, 비방, 혐오 표현'))
    await user.click(screen.getByRole('button', { name: '신고하기' }))

    // 고른 사유가 남아 있어야 다시 낼 수 있다
    await screen.findByText('이미 신고한 게시글입니다.')
    expect(onCancel).not.toHaveBeenCalled()
  })
})
