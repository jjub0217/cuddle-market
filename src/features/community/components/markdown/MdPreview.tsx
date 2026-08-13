'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import PhotoViewer from '@/components/photo-viewer/PhotoViewer'
import { cn } from '@/lib/utils/cn'
import { mdSanitizeSchema } from './sanitizeSchema'

interface MdPreviewProps {
  value: string
  height?: number
  className?: string
  /**
   * 본문 사진을 눌러 확대창을 열지. **기본은 끔.**
   *
   * ⚠️ 이 조각은 글 쓰는 화면의 미리보기에도 쓰인다(Markdown.tsx:137).
   *    거기서 켜면 글을 쓰다가 사진을 눌렀을 때 확대창이 뜬다. 상세 화면(CommunityDetail)에서만 켠다.
   */
  enablePhotoViewer?: boolean
}

export default function MdPreview({ value, height, className, enablePhotoViewer = false }: MdPreviewProps) {
  // 지금 크게 보고 있는 사진. 안 보고 있으면 null.
  //
  // ⚠️ 본문 사진을 **모아 두지 않고 누른 것 하나만** 넘긴다. 마크다운을 우리가 훑는 것이
  //    아니라 react-markdown 이 그리는 것이라, 몇 번째 사진인지를 조각 쪽에서 알 수 없다.
  //    상품 상세(MainImage)는 사진 목록을 이미 배열로 들고 있어서 넘기기가 되지만
  //    여기서는 한 장짜리 확대창이다.
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)

  return (
    <>
      <div className={cn('overflow-y-auto bg-white p-3', className)} style={height ? { height, overflowY: 'auto' } : undefined}>
        <ReactMarkdown
          remarkPlugins={[remarkBreaks]}
          rehypePlugins={[[rehypeSanitize, mdSanitizeSchema]]}
          components={{
            h1: (p) => <h1 {...p} className="mt-2 mb-2 text-2xl font-semibold" />,
            h2: (p) => <h2 {...p} className="mt-2 mb-2 text-xl font-semibold" />,
            h3: (p) => <h3 {...p} className="mt-2 mb-1 text-lg font-semibold" />,
            p: (p) => <p {...p} className="mb-3 first:mt-0 mt-3" />,
            ul: (p) => <ul {...p} className="my-2 ml-5 list-disc" />,
            ol: (p) => <ol {...p} className="my-2 ml-5 list-decimal" />,
            li: (p) => <li {...p} className="my-1" />,
            a: (p) => <a {...p} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" />,
            code: (p) => <code {...p} className="rounded bg-gray-100 px-1 py-0.5" />,
            blockquote: (p) => <blockquote {...p} className="my-2 border-l-4 pl-3 text-gray-700 italic" />,
            img: (p) => (
              <img
                {...p}
                onClick={enablePhotoViewer && p.src ? () => setViewerSrc(String(p.src)) : undefined}
                className={cn('my-2 h-auto w-full md:max-w-[50%] rounded-lg', enablePhotoViewer && p.src && 'cursor-zoom-in')}
              />
            ),
          }}
        >
          {value || '미리보기 내용이 없습니다.'}
        </ReactMarkdown>
      </div>

      {/* 확대창은 화면을 덮으므로 본문 밖(마지막)에 둔다.
          꺼져 있으면 아예 안 그린다 — 글쓰기 미리보기에는 없는 편이 낫다 */}
      {enablePhotoViewer ? (
        <PhotoViewer
          images={viewerSrc ? [viewerSrc] : []}
          isOpen={viewerSrc !== null}
          onClose={() => setViewerSrc(null)}
          alt="본문 사진"
        />
      ) : null}
    </>
  )
}
