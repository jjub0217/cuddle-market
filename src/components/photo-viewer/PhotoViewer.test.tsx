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

describe('실제 크기로 보기', () => {
  it('처음에는 화면 맞춤이다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('사진을 누르면 실제 크기가 된다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'true')
  })

  it('한 번 더 누르면 화면 맞춤으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))
    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('다음 사진으로 넘어가면 화면 맞춤으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))
    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 2')).toHaveAttribute('data-zoomed', 'false')
  })
})

// 끌기와 누르기를 가르는 장치. 2026-08-13 에 여기서 버그가 났다 —
// 누르자마자 붙잡으면(setPointerCapture) 뒤따라오는 click 이 사진이 아니라
// 붙잡은 쪽(검은 자리)으로 가서, **확대를 끄려던 누름이 창을 닫았다.**
//
// ⚠️ jsdom 에는 붙잡기가 없다. 그래서 여기서 보는 것은 「언제 붙잡는가」뿐이고,
//    「그래서 click 이 어디로 가는가」는 **브라우저에서만** 드러난다.
describe('끌기와 누르기 가르기', () => {
  it('움직이지 않고 누르면 붙잡지 않는다', () => {
    const 붙잡기 = vi.fn()
    HTMLElement.prototype.setPointerCapture = 붙잡기

    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)
    fireEvent.click(screen.getByAltText('캣타워 - 1')) // 실제 크기로
    fireEvent.pointerDown(screen.getByTestId('photo-viewer-backdrop'), { clientX: 10, clientY: 10 })

    expect(붙잡기).not.toHaveBeenCalled()
  })

  it('움직이기 시작하면 그때 붙잡는다', () => {
    const 붙잡기 = vi.fn()
    HTMLElement.prototype.setPointerCapture = 붙잡기

    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)
    fireEvent.click(screen.getByAltText('캣타워 - 1'))
    const 바탕 = screen.getByTestId('photo-viewer-backdrop')
    fireEvent.pointerDown(바탕, { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(바탕, { clientX: 40, clientY: 10 })

    expect(붙잡기).toHaveBeenCalled()
  })
})
