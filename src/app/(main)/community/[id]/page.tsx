import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import CommunityDetail from '@/features/community/CommunityDetail'
import CommunityDetailSkeleton from '@/features/community/components/CommunityDetailSkeleton'
import { fetchCommunityDetail, fetchCommunityComments } from '@/lib/api/server/community'

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CommunityDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await fetchCommunityDetail(id)

  if (!post) {
    return { title: '게시글을 찾을 수 없습니다 | 커들마켓' }
  }

  const title = `${post.title} | 커들마켓 커뮤니티`
  const description = post.contentPreview?.slice(0, 155) || '커들마켓 커뮤니티에서 확인해보세요'

  return {
    title,
    description,
    alternates: {
      canonical: `/community/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://cuddle-market.vercel.app/community/${id}`,
      siteName: '커들마켓',
      images: post.imageUrls?.[0] ? [{ url: post.imageUrls[0] }] : [{ url: '/og-image.png' }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.imageUrls?.[0] ? [post.imageUrls[0]] : ['/og-image.png'],
    },
  }
}

export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = await params
  const [initialPostData, initialCommentData] = await Promise.all([
    fetchCommunityDetail(id),
    fetchCommunityComments(id),
  ])

  if (!initialPostData) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: initialPostData.title,
    description: initialPostData.contentPreview || '',
    image: initialPostData.imageUrls,
    author: {
      '@type': 'Person',
      name: initialPostData.authorNickname,
    },
    datePublished: initialPostData.createdAt,
    dateModified: initialPostData.updatedAt,
    articleSection: initialPostData.boardType === 'QUESTION' ? '질문' : '정보',
    publisher: {
      '@type': 'Organization',
      name: '커들마켓',
      url: 'https://cuddle-market.vercel.app',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<CommunityDetailSkeleton />}>
        <CommunityDetail initialPostData={initialPostData} initialCommentData={initialCommentData} />
      </Suspense>
    </>
  )
}
