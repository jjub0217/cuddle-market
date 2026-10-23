import { formatPrice, getPriceLabel, getTradeLabel } from '@cuddle/shared'

// 링크 미리보기(Open Graph)에 쓸 그림과 설명을 고른다.
//
// 예전에는 opengraph-image.tsx 가 요청마다 1200x630 PNG 를 그렸다. 글꼴 하나 때문에 전부
// 500 이 난 적이 있고(#1118), 카카오톡에서는 그림 안의 제목·가격이 그림 아래 제목과 겹쳤다.
// 그래서 그림은 이미 있는 사진을 그대로 쓰고, 가격·거래 상태는 설명 글자로 옮겼다(#1122).

interface OgImage {
  url: string
  width?: number
  height?: number
}

/** 사진이 없을 때 쓰는 그림. 상대 주소는 루트 layout 의 metadataBase 가 절대 주소로 바꾼다 */
export const OG_DEFAULT_IMAGE: OgImage = { url: '/assets/images/og-default.png', width: 1200, height: 630 }

/** 메타 설명 길이. 페이지 설명과 같은 기준이다 */
const MAX_DESCRIPTION = 155

/** 마크다운 사진에서 주소만 붙잡는다. `"제목"` 은 공백 뒤라 빠진다 */
const IMAGE_URL = /!\[[^\]]*\]\(\s*([^)\s]+)/g

export function pickProductOgImage(mainImageUrl: string | null | undefined): OgImage {
  return mainImageUrl ? { url: mainImageUrl } : OG_DEFAULT_IMAGE
}

/**
 * 본문의 첫 사진. 미리보기 서버가 받아 갈 수 있는 http·https 주소만 친다 —
 * 상대 주소나 `data:` 는 건너뛰고 다음 사진을 본다.
 */
export function pickCommunityOgImage(content: string | null | undefined): OgImage {
  for (const [, url] of (content ?? '').matchAll(IMAGE_URL)) {
    if (/^https?:\/\//.test(url)) return { url }
  }
  return OG_DEFAULT_IMAGE
}

/**
 * 「34,000원 · 판매중 · 본문…」. 판매요청이면 「희망 12,000원 · 요청중 · …」.
 *
 * 상품 본문은 마크다운이 아니라서 toPlainText 를 쓰지 않는다 — 「30*40cm」 의 `*` 까지 지워진다.
 */
export function buildProductOgDescription(p: {
  price: number
  productType: string
  tradeStatus: string | null
  description?: string | null
}): string {
  const label = getPriceLabel(p.productType)
  const price = `${label ? `${label} ` : ''}${formatPrice(p.price)}원`
  const head = `${price} · ${getTradeLabel(p.tradeStatus, p.productType)}`

  const body = (p.description ?? '').replace(/\s+/g, ' ').trim()
  if (!body) return head

  const full = `${head} · ${body}`
  return full.length <= MAX_DESCRIPTION ? full : `${full.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`
}
