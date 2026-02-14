'use client'

import Button from '@/components/commons/button/Button'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import type { CommunityPostRequestData } from '@/types'
import { cn } from '@/lib/utils/cn'
import RequiredLabel from '@/components/commons/RequiredLabel'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { COMMUNITY_TABS } from '@/constants/constants'
import TitleField from '@/components/commons/TitleField'
import { commonTitleValidationRules, communityContentValidationRules } from '../../signup/validationRules'
import Markdown from './markdown/Markdown'
import { ArrowLeft } from 'lucide-react'
import { fetchCommunityId, patchPost, postCommunity } from '@/lib/api/community'
import { useEffect, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import SimpleHeader from '@/components/header/SimpleHeader'
import { Z_INDEX } from '@/constants/ui'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { useUserStore } from '@/store/userStore'
import DraftModal from '@/components/modal/DraftModal'

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
  const isMd = useMediaQuery('(min-width: 768px)')
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
  const [postLoadError, setPostLoadError] = useState(false)

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
        await patchPost(Number(id), requestData)
        router.push(`/community/${id}`)
      } else {
        const response = await postCommunity(requestData)
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

  useEffect(() => {
    const loadPost = async () => {
      if (isEditMode && id) {
        try {
          const data = await fetchCommunityId(id)
          reset({
            boardType: data.boardType,
            title: data.title,
            content: data.content,
            imageUrls: data.imageUrls ?? [],
          })
        } catch {
          setPostLoadError(true) // 에러 상태 설정
        }
      }
    }
    loadPost()
  }, [id, isEditMode, reset])

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
      {!isMd ? (
        <div
          className={cn('bg-primary-200 sticky top-0 mx-auto flex w-full max-w-7xl justify-between px-3.5 py-4', Z_INDEX.HEADER)}
        >
          <button type="button" onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 text-gray-600">
            <ArrowLeft size={23} className="text-white" />
          </button>
          <span className="heading-h4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-extrabold! text-white">
            커뮤니티
          </span>
        </div>
      ) : (
        <SimpleHeader
          title="커뮤니티 글쓰기"
          description="일상 이야기를 마음껏 나눠보세요!"
          layoutClassname="py-5 flex-col justify-between border-b border-gray-200"
        />
      )}
      <div className="bg-[#F3F4F6]">
        <div className="px-lg mx-auto max-w-7xl pt-5">
          <AnimatePresence>
            {postError && (
              <InlineNotification type="error" onClose={() => setPostError(null)}>
                {postError}
              </InlineNotification>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="min-h-screen bg-[#F3F4F6] pt-5">
        <div className="px-lg pb-4xl mx-auto max-w-7xl">
          <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
            <fieldset className="flex flex-col gap-5">
              <legend className="sr-only">커뮤니티 등록폼</legend>
              <div className="flex flex-col gap-6 rounded-lg border border-gray-400 bg-white px-3.5 py-5 shadow-xl md:px-6">
                <Controller
                  name="boardType"
                  control={control}
                  rules={{ required: '카테고리를 선택해주세요' }}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1">
                      <RequiredLabel labelClass="heading-h5">카테고리</RequiredLabel>
                      <SelectDropdown
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={COMMUNITY_TABS.map((category) => ({
                          value: category.code,
                          label: category.label,
                        }))}
                        placeholder="질문 있어요"
                        optionClassName="text-base"
                        buttonClassName="border border-gray-400 bg-white text-gray-900 px-3 py-3 text-base"
                      />
                      {fieldState.error && <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <TitleField<CommunityPostFormValues>
                  register={register}
                  errors={errors}
                  fieldName="title"
                  rules={commonTitleValidationRules}
                  label="제목"
                  titleLength={titleLength}
                  maxLength={50}
                  id="community-title"
                  placeholder="제목을 입력해주세요"
                  size="text-base"
                  counterClassName="text-sm text-gray-500"
                />
              </div>
              <div className="rounded-lg border border-gray-400 bg-white px-3.5 py-5 shadow-xl md:px-6">
                <Controller
                  name="content"
                  control={control}
                  rules={communityContentValidationRules}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1">
                      <RequiredLabel labelClass="heading-h5">내용</RequiredLabel>
                      <Markdown value={field.value} onChange={field.onChange} placeholder="내용을 입력하세요" height={320} />
                      <div className="flex flex-col gap-1">
                        {fieldState.error && (
                          <p className="pt-1.5 text-xs font-semibold text-red-500">{fieldState.error.message}</p>
                        )}
                        <p className="text-sm text-gray-500">{field.value?.length ?? 0}/1000자</p>
                      </div>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="md"
                  className={cn('w-[80%] flex-1 cursor-pointer text-white', !isValid ? 'bg-gray-300' : 'bg-primary-200')}
                  type="submit"
                >
                  {isEditMode ? '수정' : '등록'}
                </Button>
                <Button
                  size="md"
                  className="w-[20%] cursor-pointer bg-gray-100 text-gray-900"
                  type="button"
                  onClick={handleCancel}
                >
                  취소
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      {showDraftModal && (
        <DraftModal
          initialBoardType={initialBoardType}
          setIsDraftChecked={setIsDraftChecked}
          showDraftModal={showDraftModal}
          setShowDraftModal={setShowDraftModal}
          clearDraft={clearDraft}
          getSavedDraft={getSavedDraft}
          reset={reset}
        />
      )}
    </>
  )
}
