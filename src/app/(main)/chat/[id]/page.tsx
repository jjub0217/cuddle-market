import { Suspense } from 'react'
import ChattingPage from '@/features/chatting-page/ChattingPage'

export const dynamic = 'force-dynamic'

export default function ChatRoomPage() {
  return (
    <Suspense fallback={null}>
      <ChattingPage />
    </Suspense>
  )
}
