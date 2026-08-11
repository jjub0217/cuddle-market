import type { ImageUploadResponse } from '@/types'
import { api } from './api'

/**
 * 「나는 지금 이 방을 보고 있다」를 서버에 다시 알린다(#886).
 *
 * 서버는 이 표시를 **메시지 첫 페이지를 조회할 때만** 세우고 **5분 뒤 지운다**
 * (`ChatSessionServiceImpl`의 `SESSION_TTL_MINUTES = 5`). 갱신하는 곳이 없어서,
 * 방을 열어 두고 5분이 지나면 서버는 「이 사람 방에 없다」고 보고 안 읽은 수를 올리고
 * 알림까지 만든다. **읽고 있는 글에 「안 읽음 1」이 붙는다.**
 *
 * 이 요청이 **읽음 처리도 겸한다** — 서버가 마지막 읽은 시각을 갱신한다.
 * 그래서 이미 올라간 안 읽은 수도 여기서 0으로 돌아온다.
 *
 * ⚠️ 메시지를 받아 오려는 게 아니라 **알리려고** 부른다. 그래서 한 개만 받는다.
 *    화면에 그릴 것은 이미 조회 훅이 들고 있다.
 */
export const pingChatRoomRead = async (chatRoomId: number): Promise<void> => {
  await api.get(`/chat/rooms/${chatRoomId}/messages`, { params: { page: 0, size: 1 } })
}

export const uploadImage = async (files: File[]): Promise<ImageUploadResponse['data']> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  const response = await api.post<ImageUploadResponse>('/images', formData)
  return response.data.data
}
