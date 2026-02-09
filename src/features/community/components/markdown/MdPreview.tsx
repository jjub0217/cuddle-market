import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils/cn'
import { mdSanitizeSchema } from './sanitizeSchema'

interface MdPreviewProps {
  value: string
  height?: number
  className?: string
}

export default function MdPreview({ value, height, className }: MdPreviewProps) {
  return (
    <div className={cn('overflow-y-auto bg-white p-3', className)} style={height ? { height, overflowY: 'auto' } : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, mdSanitizeSchema]]}
        components={{
          h1: (p) => <h1 {...p} className="mt-2 mb-2 text-2xl font-semibold" />,
          h2: (p) => <h2 {...p} className="mt-2 mb-2 text-xl font-semibold" />,
          h3: (p) => <h3 {...p} className="mt-2 mb-1 text-lg font-semibold" />,
          p: (p) => <p {...p} className="my-3" />,
          ul: (p) => <ul {...p} className="my-2 ml-5 list-disc" />,
          ol: (p) => <ol {...p} className="my-2 ml-5 list-decimal" />,
          li: (p) => <li {...p} className="my-1" />,
          a: (p) => <a {...p} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" />,
          code: (p) => <code {...p} className="rounded bg-gray-100 px-1 py-0.5" />,
          blockquote: (p) => <blockquote {...p} className="my-2 border-l-4 pl-3 text-gray-700 italic" />,
        }}
      >
        {value || '미리보기 내용이 없습니다.'}
      </ReactMarkdown>
    </div>
  )
}
