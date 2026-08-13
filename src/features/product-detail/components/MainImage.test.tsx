import { describe, expect, it } from 'vitest'

import { fireEvent, render, screen } from '@/test/render'

import MainImage from './MainImage'

// 상품 상세 대표 이미지. #788의 react-hooks/refs 3건이 여기였다.
//
// ⚠️ 이 시험이 **안 덮는 것**: 이전/다음 버튼을 눌렀을 때 실제로 넘어가는가.
//    Swiper는 요소 크기를 재서 도는데 jsdom에는 배치가 없어(모든 크기가 0) 캐러셀이
//    제대로 서지 않는다. 그건 실제 브라우저에서 봐야 한다.
//
// 여기서는 그 앞단만 본다 — 버튼이 있는지, 사진이 몇 장 그려지는지, 상태 배지가 맞는지.
// 버튼 요소를 Swiper에 넘기는 방식(콜백 ref → state)을 바꿨으므로 **버튼이 화면에
// 붙는 것 자체**가 깨지면 여기서 잡힌다.

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp', 'https://cdn/c.webp']

describe('이전·다음 버튼', () => {
  it('사진이 여러 장이면 버튼이 있다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    expect(screen.getByRole('button', { name: '이전 이미지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 이미지' })).toBeInTheDocument()
  })

  it('사진이 한 장이면 버튼이 없다', () => {
    render(<MainImage mainImageUrl={IMAGES[0]} subImageUrls={[]} title="캣타워" tradeStatus={null} productTypeName="판매상품" />)

    expect(screen.queryByRole('button', { name: '이전 이미지' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 이미지' })).not.toBeInTheDocument()
  })
})

describe('사진', () => {
  it('대표 + 서브를 다 그린다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    expect(screen.getByAltText('캣타워 - 1')).toBeInTheDocument()
    expect(screen.getByAltText('캣타워 - 2')).toBeInTheDocument()
    expect(screen.getByAltText('캣타워 - 3')).toBeInTheDocument()
  })

  it('사진이 없어도 자리를 하나 그린다', () => {
    render(<MainImage mainImageUrl={null} subImageUrls={[]} title="캣타워" tradeStatus={null} productTypeName="판매상품" />)

    expect(screen.getByAltText('캣타워 - 1')).toBeInTheDocument()
  })
})

describe('거래상태 배지', () => {
  it('예약중이면 배지가 뜬다', () => {
    render(
      <MainImage mainImageUrl={IMAGES[0]} subImageUrls={[]} title="캣타워" tradeStatus="예약중" productTypeName="판매상품" />
    )

    expect(screen.getByText('예약중')).toBeInTheDocument()
  })

  it('판매요청의 판매완료는 「요청완료」로 보여준다', () => {
    render(
      <MainImage mainImageUrl={IMAGES[0]} subImageUrls={[]} title="캣타워" tradeStatus="판매완료" productTypeName="판매요청" />
    )

    expect(screen.getByText('요청완료')).toBeInTheDocument()
  })

  it('거래중이 아니면 배지가 없다', () => {
    render(<MainImage mainImageUrl={IMAGES[0]} subImageUrls={[]} title="캣타워" tradeStatus={null} productTypeName="판매상품" />)

    expect(screen.queryByText('예약중')).not.toBeInTheDocument()
    expect(screen.queryByText('판매완료')).not.toBeInTheDocument()
  })
})

describe('사진 확대창', () => {
  // ⚠️ Swiper 는 loop 를 쓰면 같은 사진을 여러 벌 그린다. 첫 번째 것을 누른다.
  it('사진을 누르면 확대창이 열린다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    fireEvent.click(screen.getAllByAltText('캣타워 - 1')[0])

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })

  it('처음에는 확대창이 닫혀 있다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  // 사진이 하나도 없으면 slides 에 든 것은 자리표시자다. 띄울 것이 없으니 안 연다.
  it('사진이 하나도 없으면 눌러도 안 열린다', () => {
    render(<MainImage mainImageUrl={null} subImageUrls={[]} title="캣타워" tradeStatus={null} productTypeName="판매상품" />)

    fireEvent.click(screen.getAllByAltText('캣타워 - 1')[0])

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })
})
