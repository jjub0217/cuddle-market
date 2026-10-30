import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './api'
import { fetchAdminCommunityPosts } from './admin'

vi.mock('./api', () => ({ api: { get: vi.fn() } }))

// 행사 소식 글은 일반 목록에서 빠진다. 관리자 목록만 includeEvent=true 로 함께 받는다(#1124)
describe('fetchAdminCommunityPosts', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { content: [], totalElements: 0 } } })
  })

  const lastUrl = () => new URL(String(vi.mocked(api.get).mock.calls.at(-1)?.[0]), 'http://x')

  it('행사 소식 글까지 받도록 includeEvent=true 를 보낸다', async () => {
    await fetchAdminCommunityPosts({ page: 1, pageSize: 10 } as never)
    expect(lastUrl().searchParams.get('includeEvent')).toBe('true')
  })

  it('「행사소식」 거르기는 boardType=EVENT 로 보낸다', async () => {
    await fetchAdminCommunityPosts({ page: 1, pageSize: 10, filters: { boardType: '행사소식' } } as never)
    expect(lastUrl().searchParams.get('boardType')).toBe('EVENT')
  })
})
