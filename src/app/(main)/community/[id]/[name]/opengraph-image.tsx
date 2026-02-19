import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchCommunityDetail } from '@/lib/api/server/community'
import { getKoreanFont } from '@/lib/og/fonts'
import { OG_SIZE, OG_COLORS, BOARD_TYPE_STYLE } from '@/lib/og/constants'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = OG_SIZE
export const revalidate = 3600

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [post, fontData, logoData] = await Promise.all([
    fetchCommunityDetail(id),
    getKoreanFont(),
    readFile(join(process.cwd(), 'public', 'assets', 'images', 'logo-og.png')),
  ])

  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  if (!post) {
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: OG_COLORS.backgroundLight }}>
        <img alt="" src={logoBase64} width={120} height={139} />
      </div>,
      { ...size, fonts: [{ name: 'NotoSansKR', data: fontData, style: 'normal' as const }] },
    )
  }

  const boardStyle = BOARD_TYPE_STYLE[post.boardType ?? 'QUESTION'] ?? BOARD_TYPE_STYLE.QUESTION
  const preview = (post.contentPreview || '').slice(0, 120)

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: OG_COLORS.background }}>
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 60px', justifyContent: 'center', gap: '20px' }}>
        <div style={{ display: 'flex' }}>
          <span style={{ backgroundColor: boardStyle.color, color: OG_COLORS.white, padding: '6px 18px', borderRadius: 20, fontSize: 22, fontWeight: 700 }}>
            {boardStyle.label}
          </span>
        </div>
        <p style={{ fontSize: 40, fontWeight: 700, color: OG_COLORS.textPrimary, overflow: 'hidden' }}>
          {post.title.slice(0, 50)}
        </p>
        {preview && (
          <p style={{ fontSize: 24, color: OG_COLORS.textSecondary, overflow: 'hidden' }}>
            {preview}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', fontSize: 20, color: OG_COLORS.textSecondary, marginTop: '8px' }}>
          <span>{post.authorNickname}</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
          <span>조회 {post.viewCount}</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
          <span>댓글 {post.commentCount}</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', height: 60, backgroundColor: OG_COLORS.primary, alignItems: 'center', padding: '0 48px', gap: '12px' }}>
        <img alt="" src={logoBase64} width={32} height={37} />
        <span style={{ color: OG_COLORS.white, fontSize: 22, fontWeight: 700 }}>커들마켓 커뮤니티</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'NotoSansKR', data: fontData, style: 'normal' as const }],
    },
  )
}
