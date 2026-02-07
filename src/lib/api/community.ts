import type {
  DeleteResponse,
  CommentPostRequestData,
  CommentPostResponse,
  CommentResponse,
  CommunityDetailItemResponse,
  CommunityPostRequestData,
  CommunityPostResponse,
  CommunityResponse,
  ReportedRequestData,
  ReportedResponse,
} from '@/types'
import axios from 'axios'
import { api } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export const fetchQuestionCommunity = async (
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  if (searchType) params.append('searchType', searchType)
  if (keyword) params.append('keyword', keyword)
  if (sortBy) params.append('sortBy', sortBy)

  const response = await axios.get<CommunityResponse>(`${API_BASE_URL}/community/posts?boardType=QUESTION&${params.toString()}`)
  return response.data.data
}

export const fetchInfoCommunity = async (
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  if (searchType) params.append('searchType', searchType)
  if (keyword) params.append('keyword', keyword)
  if (sortBy) params.append('sortBy', sortBy)

  const response = await axios.get<CommunityResponse>(`${API_BASE_URL}/community/posts?boardType=INFO&${params.toString()}`)
  return response.data.data
}

export const postCommunity = async (requestData: CommunityPostRequestData) => {
  const response = await api.post<CommunityPostResponse>(`/community/posts`, requestData)
  return response.data.data
}

export const fetchCommunityId = async (postId: string) => {
  const response = await api.get<CommunityDetailItemResponse>(`/community/posts/${postId}`)
  return response.data.data
}

export const patchPost = async (postId: number, requestData: CommunityPostRequestData) => {
  const response = await api.patch<DeleteResponse>(`/community/posts/${postId}`, requestData)
  return response.data.data
}

export const deletePost = async (postId: number) => {
  const response = await api.delete<DeleteResponse>(`/community/posts/${postId}`)
  return response.data.data
}

export const fetchComments = async (postId: string) => {
  const response = await api.get<CommentResponse>(`/community/posts/${postId}/comments`)
  return response.data.data
}

export const fetchReplies = async (commentId: string) => {
  const response = await api.get<CommentResponse>(`/community/comments/${commentId}/replies`)
  return response.data.data
}

export const postReply = async (requestData: CommentPostRequestData, postId: string) => {
  const response = await api.post<CommentPostResponse>(`/community/posts/${postId}/comments`, requestData)
  return response.data.data
}

export const deleteReply = async (commentId: number) => {
  const response = await api.delete<DeleteResponse>(`/community/comments/${commentId}`)
  return response.data.data
}

export const postReported = async (postId: number, requestData: ReportedRequestData) => {
  const response = await api.post<ReportedResponse>(`/reports/community-posts/${postId}`, requestData)
  return response.data.data
}
