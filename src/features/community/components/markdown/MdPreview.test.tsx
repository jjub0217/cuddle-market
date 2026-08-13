import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'

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
