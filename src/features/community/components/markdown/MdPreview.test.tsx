import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'
import { PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

import MdPreview from './MdPreview'

// 커뮤니티 본문 사진 확대창(#904).
//
// ⚠️ 이 시험이 **안 덮는 것**: 확대창 자체의 움직임(넘기기·확대·ESC)은
//    `src/components/photo-viewer/PhotoViewer.test.tsx` 가 덮는다. 여기서는
//    「눌렀을 때 열리는가 · 글쓰기 미리보기에서는 안 열리는가」만 본다.

const 본문 = '![고양이](https://cdn/a.jpg)'

describe('본문 사진 확대창', () => {
  it('켜 두면 본문 사진을 눌러 확대창을 연다', () => {
    render(<MdPreview value={본문} enablePhotoViewer />)

    fireEvent.click(screen.getByAltText('고양이'))

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })

  it('기본값(글쓰기 미리보기)에서는 안 열린다', () => {
    render(<MdPreview value={본문} />)

    fireEvent.click(screen.getByAltText('고양이'))

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  // 본문에 사진이 없는 글도 있다. 그때 확대창이 저 혼자 뜨면 안 된다.
  it('사진이 없는 글에서는 확대창이 안 뜬다', () => {
    render(<MdPreview value="사진 없는 글" enablePhotoViewer />)

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })
})

// 행사 포스터는 기관 서버의 원래 주소를 그대로 불러온다(행사 소식 설계 9절, #1124).
// 기관이 주소를 바꾸거나 다른 사이트에서 불러오는 것을 막으면 깨진 그림 표시가 남는다.
describe('외부 포스터', () => {
  const POSTER = 'https://www.nowon.kr/no-such-poster.png'

  it('외부 주소를 크기 변환 없이 그대로 불러온다', () => {
    render(<MdPreview value={`![포스터](${POSTER})`} />)

    expect(screen.getByAltText('포스터')).toHaveAttribute('src', POSTER)
  })

  it('불러오지 못하면 기본 그림으로 바꾼다', () => {
    render(<MdPreview value={`![포스터](${POSTER})`} />)
    const img = screen.getByAltText('포스터')

    fireEvent.error(img)

    expect(img.getAttribute('src')).toBe(PLACEHOLDER_IMAGES[800])
  })
})
