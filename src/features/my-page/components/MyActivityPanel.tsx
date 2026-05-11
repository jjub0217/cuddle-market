'use client'

import Link from 'next/link'
import EmptyState from '@/components/EmptyState'
import { FileText, MessageSquareText } from 'lucide-react'

export default function MyActivityPanel() {
  return (
    <div className="flex flex-col gap-8">
      <section className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-on-surface text-lg font-bold">나의 커뮤니티 글</h2>
          <Link href="/community" className="text-primary text-sm font-bold hover:underline">
            글 쓰러 가기
          </Link>
        </div>
        <EmptyState
          icon={FileText}
          title="작성한 커뮤니티 글이 없습니다"
          description="반려생활 이야기를 첫 글로 남겨보세요."
        />
      </section>

      <section className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-on-surface text-lg font-bold">최근 작성한 댓글</h2>
          <Link href="/community" className="text-primary text-sm font-bold hover:underline">
            커뮤니티 보기
          </Link>
        </div>
        <EmptyState
          icon={MessageSquareText}
          title="작성한 댓글이 없습니다"
          description="관심 있는 글에 댓글을 남겨보세요."
        />
      </section>
    </div>
  )
}
