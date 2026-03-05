import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchProductDetail } from '@/lib/api/server/products'
import { getKoreanFont } from '@/lib/og/fonts'
import { OG_SIZE, OG_COLORS, TRADE_STATUS_STYLE } from '@/lib/og/constants'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = OG_SIZE
export const revalidate = 3600

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, fontData, logoData] = await Promise.all([
    fetchProductDetail(id),
    getKoreanFont(),
    readFile(join(process.cwd(), 'public', 'assets', 'images', 'logo-og.png')),
  ])

  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  if (!product) {
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: OG_COLORS.backgroundLight }}>
        <img alt="" src={logoBase64} width={120} height={139} />
      </div>,
      { ...size, fonts: [{ name: 'NotoSansKR', data: fontData, style: 'normal' as const }] },
    )
  }

  const status = (product.tradeStatus ? TRADE_STATUS_STYLE[product.tradeStatus] : null) ?? TRADE_STATUS_STYLE.SELLING
  const price = `${Math.floor(product.price).toLocaleString()}원`

  let productImageSrc: string | null = null
  if (product.mainImageUrl) {
    try {
      const res = await fetch(product.mainImageUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('png') || ct.includes('jpeg') || ct.includes('jpg')) {
        productImageSrc = product.mainImageUrl
      }
    } catch {
      /* use placeholder */
    }
  }

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: OG_COLORS.background }}>
      {/* Content */}
      <div style={{ display: 'flex', flex: 1, padding: '48px', gap: '40px', alignItems: 'center' }}>
        {/* Product image */}
        <div style={{ display: 'flex', width: 340, height: 340, borderRadius: 20, overflow: 'hidden', backgroundColor: OG_COLORS.backgroundLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {productImageSrc ? (
            <img alt="" src={productImageSrc} width={340} height={340} style={{ objectFit: 'cover' }} />
          ) : (
            <img alt="" src={logoBase64} width={100} height={116} />
          )}
        </div>
        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '16px' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ backgroundColor: status.color, color: OG_COLORS.white, padding: '6px 18px', borderRadius: 20, fontSize: 22, fontWeight: 700 }}>
              {status.label}
            </span>
          </div>
          <p style={{ fontSize: 36, fontWeight: 700, color: OG_COLORS.textPrimary, overflow: 'hidden' }}>
            {product.title.slice(0, 50)}
          </p>
          <p style={{ fontSize: 44, fontWeight: 700, color: OG_COLORS.primary }}>
            {price}
          </p>
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', height: 60, backgroundColor: OG_COLORS.primary, alignItems: 'center', padding: '0 48px', gap: '12px' }}>
        <img alt="" src={logoBase64} width={32} height={37} />
        <span style={{ color: OG_COLORS.white, fontSize: 22, fontWeight: 700 }}>커들마켓</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22 }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>반려동물 용품 중고마켓</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'NotoSansKR', data: fontData, style: 'normal' as const }],
    },
  )
}
