import { cn } from '@/lib/utils/cn'

export default function MdFooter({ id, className, children }: { id?: string; className?: string; children?: React.ReactNode; attached?: boolean }) {
  return (
    <div id={id} className={cn('border-t border-gray-400 bg-gray-100 px-3 py-2 text-xs leading-5 text-gray-500', className)}>
      {children ?? (
        <div className="flex flex-wrap items-center gap-2">
          <span>마크다운 문법을 사용할 수 있습니다.</span>
          <strong>**굵게**</strong>
          <em>*기울임*</em>
          <span>`코드`</span>
          <span>[링크](URL)</span>
          <span>## 제목</span>
        </div>
      )}
    </div>
  )
}
