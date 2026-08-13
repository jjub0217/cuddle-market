import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'

import PhotoViewer from './PhotoViewer'

// 사진 확대창(#904).
//
// ⚠️ 이 시험이 **안 덮는 것**: 진짜 ESC 키, 화면을 덮는 층(top layer), 끌어서 움직이기.
//    jsdom 에는 배치도 스크롤도 없고 <dialog> 도 반쪽만 있다(vitest.setup.ts).
//    그것들은 브라우저에서 눈으로 본다.

const IMAGES = ['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg']

describe('열고 닫기', () => {
  it('닫혀 있으면 사진을 안 그린다', () => {
    render(<PhotoViewer images={IMAGES} isOpen={false} onClose={vi.fn()} alt="캣타워" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('열려 있으면 시작 사진을 그린다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={1} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 2')).toBeInTheDocument()
  })

  it('닫기 단추를 누르면 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(닫힘).toHaveBeenCalledOnce()
  })

  it('검은 자리를 누르면 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByTestId('photo-viewer-backdrop'))

    expect(닫힘).toHaveBeenCalledOnce()
  })

  it('사진을 눌러도 닫히지 않는다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(닫힘).not.toHaveBeenCalled()
  })

  // ESC 는 브라우저가 dialog 에 'cancel' 을 쏘는 것으로 시작한다.
  // jsdom 은 키를 눌러도 안 쏘므로 사건을 직접 쏜다 — 연결만 지킨다.
  it('ESC(cancel 사건)로 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent(screen.getByTestId('photo-viewer'), new Event('cancel'))

    expect(닫힘).toHaveBeenCalledOnce()
  })
})

describe('여러 장 넘기기', () => {
  it('한 장이면 넘기는 단추가 없다', () => {
    render(<PhotoViewer images={[IMAGES[0]]} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.queryByRole('button', { name: '다음 이미지' })).not.toBeInTheDocument()
  })

  it('다음을 누르면 다음 사진이 나온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 2')).toBeInTheDocument()
  })

  it('마지막에서 다음을 누르면 처음으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={2} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 1')).toBeInTheDocument()
  })

  it('몇 번째인지 보여준다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={1} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })
})
