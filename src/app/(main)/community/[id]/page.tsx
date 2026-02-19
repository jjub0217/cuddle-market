import { notFound, redirect } from 'next/navigation'
import { fetchCommunityDetail } from '@/lib/api/server/community'
import { toUrlName } from '@/lib/utils/toUrlName'

interface CommunityRedirectPageProps {
  params: Promise<{ id: string }>
}

export default async function CommunityRedirectPage({ params }: CommunityRedirectPageProps) {
  const { id } = await params
  const post = await fetchCommunityDetail(id)

  if (!post) {
    notFound()
  }

  redirect(`/community/${id}/${toUrlName(post.title)}`)
}
