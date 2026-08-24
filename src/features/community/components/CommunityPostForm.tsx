'use client'

import { Controller, useForm, useWatch } from 'react-hook-form'
import Button from '@/components/commons/button/Button'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import type { CommunityPostRequestData } from '@/types'
import { cn } from '@/lib/utils/cn'
// import RequiredLabel from '@/components/commons/RequiredLabel'
import { COMMUNITY_TABS } from '@/constants/constants'
import { commonTitleValidationRules, communityContentValidationRules } from '../../signup/validationRules'
import Markdown from './markdown/Markdown'
import { Info } from 'lucide-react'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SimpleHeader from '@/components/header/SimpleHeader'
import MobileBackHeader from '@/components/header/MobileBackHeader'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { useUserStore } from '@/store/userStore'
import dynamic from 'next/dynamic'
import { PAGE_CONTAINER } from '@/constants/ui'
const DraftModal = dynamic(() => import('@/components/modal/DraftModal'))

export interface CommunityPostFormValues {
  boardType: string
  title: string
  content: string
  imageUrls?: string[]
}

// Storage key 생성 함수
const getDraftStorageKey = (boardType: string) => `community-post-draft-${boardType}`

// 임시 저장 데이터 삭제
const clearDraft = (boardType: string) => {
  sessionStorage.removeItem(getDraftStorageKey(boardType))
}

// sessionStorage에서 임시 저장된 데이터 불러오기
const getSavedDraft = (boardType: string): CommunityPostFormValues => {
  const saved = sessionStorage.getItem(getDraftStorageKey(boardType))
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return { boardType, title: '', content: '', imageUrls: [] }
    }
  }
  return { boardType, title: '', content: '', imageUrls: [] }
}

export default function CommunityPostForm() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const isEditMode = !!id
  const { user, _hasHydrated, setRedirectUrl } = useUserStore()
  const searchParams = useSearchParams()
  const initialBoardType = searchParams.get('tab') === 'tab-question' ? 'QUESTION' : 'INFO'
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [isDraftChecked, setIsDraftChecked] = useState(isEditMode)

  const pathname = usePathname()

  const {
    control,
    handleSubmit,
    register,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm<CommunityPostFormValues>({
    mode: 'onChange',
    defaultValues: { boardType: initialBoardType, title: '', content: '', imageUrls: [] },
  })

  const formValues = useWatch({ control })
  const titleLength = useWatch({ control, name: 'title' })?.length ?? 0

  const [postError, setPostError] = useState<React.ReactNode | null>(null)
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')

  const handleCancel = () => {
    clearDraft(getValues('boardType'))
    router.push('/community')
  }

  const onSubmit = async (data: CommunityPostFormValues) => {
    const requestData: CommunityPostRequestData = {
      boardType: data.boardType,
      title: data.title,
      content: data.content,
      imageUrls: data.imageUrls ?? [],
    }

    try {
      if (isEditMode) {
        await fetchGraphQL(
          `
          mutation UpdatePost($id: Int!, $input: CommunityPostInput!) {
            updatePost(id: $id, input: $input) { success }
          }
        `,
          { id: Number(id), input: requestData }
        )
        router.push(`/community/${id}`)
      } else {
        const { createPost: response } = await fetchGraphQL<{ createPost: { id: number } }>(
          `
          mutation CreatePost($input: CommunityPostInput!) {
            createPost(input: $input) { id }
          }
        `,
          { input: requestData }
        )
        clearDraft(getValues('boardType'))
        router.push(`/community/${response.id}`)
      }
    } catch {
      setPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">{isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.'}</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  const { data: editPostData, isError: postLoadError } = useQuery({
    queryKey: ['community-edit-post', id],
    queryFn: () =>
      fetchGraphQL<{ communityPost: any }>(
        `
      query CommunityPost($id: Int!) {
        communityPost(id: $id) { id title content boardType imageUrls }
      }
    `,
        { id: Number(id!) }
      ),
    enabled: isEditMode && !!id,
  })

  useEffect(() => {
    if (editPostData) {
      const data = editPostData.communityPost
      reset({
        boardType: data.boardType,
        title: data.title,
        content: data.content,
        imageUrls: data.imageUrls ?? [],
      })
    }
  }, [editPostData, reset])

  // 새 글 작성 시 폼 데이터 변경마다 sessionStorage에 자동 저장
  useEffect(() => {
    if (!isEditMode && isDraftChecked) {
      sessionStorage.setItem(getDraftStorageKey(formValues.boardType ?? initialBoardType), JSON.stringify(formValues))
    }
  }, [formValues, isEditMode, isDraftChecked, initialBoardType])

  useEffect(() => {
    if (isEditMode) return

    // sessionStorage 읽기 후 상태 업데이트를 비동기로 처리
    const checkDraft = async () => {
      const draft = getSavedDraft(initialBoardType)
      const hasSavedContent = draft.title.trim() !== '' || draft.content.trim() !== ''

      if (hasSavedContent) {
        setShowDraftModal(true)
      } else {
        setIsDraftChecked(true)
      }
    }
    checkDraft()
  }, [initialBoardType, isEditMode])

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (_hasHydrated && !user?.id) {
      setRedirectUrl(pathname)
      router.push('/auth/login')
    }
  }, [_hasHydrated, user, router, setRedirectUrl, pathname])

  if (postLoadError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>게시글 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push('/community')} className="text-blue-600 hover:text-blue-800">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="sr-only">{isEditMode ? '게시글 수정' : '커뮤니티 글쓰기'}</h1>
      {/* 모바일 서브헤더 — 상품 등록과 같은 조각을 쓴다 */}
      <MobileBackHeader title={isEditMode ? '게시글 수정' : '게시글 작성'} />
      {/* 데스크톱 서브헤더 */}
      <div className="hidden md:block">
        <SimpleHeader
          title={isEditMode ? '게시글 수정' : '게시글 작성'}
          description={isEditMode ? '게시글 내용을 수정해주세요' : '일상 이야기를 마음껏 나눠보세요!'}
          layoutClassname="py-3.5 gap-0 flex-col justify-between pt-8"
          titleClassName="text-[22px] leading-[1.5] font-bold"
          descriptionClassName="text-sm"
        />
      </div>
      <div className="min-h-screen pt-5">
        <div className={cn(PAGE_CONTAINER, 'md:pb-4xl')}>
          <AnimatePresence>
            {postError ? (
              <InlineNotification type="error" onClose={() => setPostError(null)}>
                {postError}
              </InlineNotification>
            ) : null}
          </AnimatePresence>
          <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
            <fieldset className="flex flex-col gap-5">
              <legend className="sr-only">커뮤니티 등록폼</legend>
              <div className="flex flex-col gap-3.5 rounded-xl border border-gray-400 px-3.5 py-3.5 shadow-xl md:gap-5 md:rounded-3xl md:px-8 md:py-8">
                <Controller
                  name="boardType"
                  control={control}
                  rules={{ required: '카테고리를 선택해주세요' }}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                      {/* <RequiredLabel labelClass="text-sm md:text-base font-semibold">카테고리</RequiredLabel> */}
                      <div
                        className="border-outline-variant/40 flex gap-2 border-b md:gap-6"
                        role="radiogroup"
                        aria-label="카테고리 선택"
                      >
                        {COMMUNITY_TABS.map((category) => {
                          const isActive = field.value === category.code
                          return (
                            <button
                              key={category.code}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              onClick={() => field.onChange(category.code)}
                              className={cn(
                                '-mb-px cursor-pointer border-b-2 px-1 pb-2 text-sm font-medium whitespace-nowrap transition-colors md:text-base',
                                isActive
                                  ? 'border-primary text-primary font-bold'
                                  : 'text-on-surface-muted hover:text-primary border-transparent'
                              )}
                            >
                              {category.label}
                            </button>
                          )
                        })}
                      </div>
                      {fieldState.error ? <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <div className="flex flex-col gap-2">
                  <textarea
                    id="community-title"
                    {...register('title', commonTitleValidationRules)}
                    placeholder="제목을 입력해 주세요"
                    rows={1}
                    maxLength={50}
                    className="text-primary placeholder:text-primary/20 w-full resize-none overflow-hidden border-none bg-transparent text-2xl leading-tight font-bold"
                  />
                  <div className="flex items-center justify-between text-xs">
                    {errors.title ? <p className="font-semibold text-red-500">{errors.title.message}</p> : <span />}
                    <span className="text-gray-500">{titleLength}/50</span>
                  </div>
                </div>
                <Controller
                  name="content"
                  control={control}
                  rules={communityContentValidationRules}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1">
                      {/* <RequiredLabel labelClass="text-sm md:text-base font-semibold">내용</RequiredLabel> */}
                      <Markdown
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="내용을 입력하세요"
                        height={320}
                        tab={editorTab}
                      />
                      <div className="flex items-center justify-between text-xs">
                        {fieldState.error ? <p className="font-semibold text-red-500">{fieldState.error.message}</p> : <span />}
                        <div className="flex items-center gap-3 text-gray-500">
                          <p>{field.value?.length ?? 0}/1000자</p>
                          <div className="relative">
                            <button
                              type="button"
                              aria-label="마크다운 문법 안내"
                              className="peer hover:text-on-surface flex cursor-pointer items-center gap-1"
                            >
                              <Info size={14} />
                              <span>마크다운 문법을 사용할 수 있습니다.</span>
                            </button>
                            <div
                              role="tooltip"
                              className="border-outline-variant invisible absolute right-0 bottom-full z-10 mb-2 w-72 rounded-lg border bg-white p-3 text-xs opacity-0 shadow-lg transition-opacity peer-hover:visible peer-hover:opacity-100"
                            >
                              <p className="text-on-surface mb-1.5 font-semibold">마크다운 문법</p>
                              <div className="text-on-surface-muted flex gap-2">
                                <span>
                                  <strong>**굵게**</strong>
                                </span>
                                <span>
                                  <em>*기울임*</em>
                                </span>
                                <span>
                                  <code className="rounded bg-gray-100 px-1">`코드`</code>
                                </span>
                                <span>[링크](URL)</span>
                                <span>## 제목</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
                <div className="border-outline-variant flex items-center justify-between gap-3 border-t pt-4">
                  <div className="bg-surface-container-low flex items-center gap-0.5 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setEditorTab('edit')}
                      className={cn(
                        'cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all',
                        editorTab === 'edit'
                          ? 'text-on-surface bg-white shadow-sm'
                          : 'text-on-surface-muted hover:text-on-surface'
                      )}
                    >
                      작성
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={cn(
                        'cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all',
                        editorTab === 'preview'
                          ? 'text-on-surface bg-white shadow-sm'
                          : 'text-on-surface-muted hover:text-on-surface'
                      )}
                    >
                      미리보기
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-on-surface border-outline-variant hover:bg-surface-container-high hover:bg-surface-container-low cursor-pointer rounded-full border px-6 py-3 text-xs font-bold transition-all"
                    >
                      취소
                    </button>
                    <Button
                      type="submit"
                      disabled={!isValid}
                      variant={isValid ? 'primary' : 'default'}
                      className={cn(
                        'cursor-pointer rounded-full px-6 py-3 text-xs font-bold transition-all',
                        !isValid && 'cursor-not-allowed bg-gray-200 text-gray-400'
                      )}
                    >
                      {isEditMode ? '수정' : '등록'}
                    </Button>
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      {showDraftModal ? (
        <DraftModal
          initialBoardType={initialBoardType}
          setIsDraftChecked={setIsDraftChecked}
          showDraftModal={showDraftModal}
          setShowDraftModal={setShowDraftModal}
          clearDraft={clearDraft}
          getSavedDraft={getSavedDraft}
          reset={reset}
        />
      ) : null}
    </>
  )
}
