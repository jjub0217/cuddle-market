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

describe('크게 보기', () => {
  it('처음에는 화면 맞춤이다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('사진을 누르면 크게 본다', () => {
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
    fireEvent.click(screen.getByAltText('캣타워 - 1')) // 크게
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

// 확대 제스처(트랙패드로 벌리기 · ⌘+휠)는 브라우저에 **ctrl 이 눌린 휠**로 온다.
// 가로채지 않으면 브라우저가 화면 전체를 키워 X 단추·화살표·번호가 화면 밖으로 밀려난다.
describe('확대 제스처 가로채기', () => {
  it('사진 위에서 ctrl 을 누른 채 벌리면 크게 본다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { ctrlKey: true, deltaY: -100 })

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'true')
  })

  it('사진 위에서 오므리면 화면 맞춤으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { ctrlKey: true, deltaY: -100 })
    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { ctrlKey: true, deltaY: 100 })

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  // ⚠️ 맥에서 「확대」는 두 갈래로 온다 — 두 손가락 벌리기는 ctrl, ⌘+쓸기는 meta.
  //    ctrl 만 받았더니 ⌘ 로 하는 사람에게는 아무 일도 안 일어났다.
  it('⌘ 를 누른 채 벌려도 크게 본다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { metaKey: true, deltaY: -100 })

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'true')
  })

  // 번개장터도 이렇게 한다(2026-08-13 확인). 검은 자리는 브라우저 확대에 맡겨야
  // 「페이지째 키워서 보고 싶다」는 길이 남는다.
  it('검은 자리에서 벌리는 것은 브라우저에 맡긴다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByTestId('photo-viewer-backdrop'), { ctrlKey: true, deltaY: -100 })

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('그냥 휠은 건드리지 않는다 (페이지 스크롤을 뺏으면 안 된다)', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { ctrlKey: false, deltaY: -100 })

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })
})

// 배율. 1 = 화면 맞춤이고 거기서 세 배까지 키운다.
//
// ⚠️ jsdom 에는 배치가 없어 「실제로 몇 픽셀로 그려졌나」는 못 본다.
//    여기서 지키는 것은 **배율 숫자**까지다.
describe('배율', () => {
  it('화면 맞춤일 때는 크기를 안 건드린다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 1').style.transform).toBe('')
  })

  // 앱의 더블탭과 같은 값이다(mobile 의 DOUBLE_TAP_SCALE).
  it('누르면 2배로 간다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(screen.getByAltText('캣타워 - 1').style.transform).toContain('scale(2)')
  })

  // 손가락을 따라와야 한다. 예전에는 두 값(1배·2배)만 오가서 **「퉁」 튀었다.**
  it('조금 벌리면 사이 값이 나온다 (두 단계로 튀지 않는다)', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.wheel(screen.getByAltText('캣타워 - 1'), { ctrlKey: true, deltaY: -10 })

    const 배율 = Number(screen.getByAltText('캣타워 - 1').style.transform.match(/scale\(([\d.]+)\)/)?.[1])
    expect(배율).toBeGreaterThan(1)
    expect(배율).toBeLessThan(1.2)
  })

  // 앱의 핀치 상한과 같은 값이다(mobile 의 MAX_SCALE).
  it('아무리 벌려도 세 배를 넘지 않는다 (그 위는 뭉갠다)', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)
    const 사진 = () => screen.getByAltText('캣타워 - 1')

    for (let i = 0; i < 20; i += 1) {
      fireEvent.wheel(사진(), { ctrlKey: true, deltaY: -50 })
    }

    expect(사진().style.transform).toContain('scale(3)')
  })

  it('아무리 오므려도 화면 맞춤 아래로는 안 간다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)
    const 사진 = () => screen.getByAltText('캣타워 - 1')

    for (let i = 0; i < 20; i += 1) {
      fireEvent.wheel(사진(), { ctrlKey: true, deltaY: 50 })
    }

    expect(사진().style.transform).toBe('')
  })
})

// 뒤로가기로 확대창만 닫는다. 안 그러면 상품 상세에서 나가 버려 보던 자리를 잃는다.
//
// ⚠️ 여기서 지키는 것은 「뒤로가기 신호가 오면 닫는가」까지다. **기록이 몇 칸 쌓였는지는
//    시험이 못 본다** — 진짜 브라우저로 확인했다(2026-08-13, 상세에 그대로 남는 것 확인).
describe('뒤로가기', () => {
  it('뒤로가기 신호가 오면 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(닫힘).toHaveBeenCalledOnce()
  })

  it('닫혀 있을 때의 뒤로가기는 건드리지 않는다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen={false} onClose={닫힘} alt="캣타워" />)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(닫힘).not.toHaveBeenCalled()
  })
})
