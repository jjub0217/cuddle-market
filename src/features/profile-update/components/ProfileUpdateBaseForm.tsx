'use client'

import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import Image from 'next/image'
import RequiredLabel from '@/components/commons/RequiredLabel'
import InputWithButton from '@/components/commons/InputWithButton'
import AddressField from '@/components/commons/AddressField'
import type { Province } from '@/constants/cities'
import { useForm, useWatch } from 'react-hook-form'
import { profileValidationRules } from '@/lib/utils/validation/authValidationRules'
import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'
import type { MyPageData } from '@/components/profile/ProfileData'
import { formatBirthDate } from '@/lib/utils/formatBirthDate'
import { checkNickname } from '@/lib/api/auth'
import { useState, useEffect, useRef } from 'react'
import { profileUpdate } from '@/lib/api/profile'
import { useUserStore } from '@/store/userStore'
import { uploadImage } from '@/lib/api/products'
import { useQueryClient } from '@tanstack/react-query'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Camera } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import imageCompression from 'browser-image-compression'

export interface ProfileUpdateBaseFormValues {
  nickname: string
  birthDate: string
  profileImageUrl: string
  introduction: string
  addressSido: Province | ''
  addressGugun: string
}
const IMAGE_UPLOAD_ERRORS = {
  'file-too-large': '파일 크기는 5MB를 초과할 수 없습니다.',
  'file-invalid-type': '지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp만 가능)',
  'upload-failed': '이미지 업로드에 실패했습니다. 다시 시도해주세요.',
} as const

interface ProfileUpdateBaseFormProps {
  myData?: MyPageData
}
export default function ProfileUpdateBaseForm({ myData }: ProfileUpdateBaseFormProps) {
  const {
    control,
    handleSubmit,
    register,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateBaseFormValues>({
    mode: 'onChange',
    defaultValues: {
      nickname: '',
      birthDate: '',
      profileImageUrl: '',
      introduction: '',
      addressSido: '',
      addressGugun: '',
    },
  })
  const { user, updateUserProfile } = useUserStore()

  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMd = useMediaQuery('(min-width: 768px)')
  const [, setIsNicknameVerified] = useState(false)

  const [updateError, setUpdateError] = useState<React.ReactNode | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<React.ReactNode | null>(null)
  const [updateWarning, setUpdateWarning] = useState<React.ReactNode | null>(null)

  const [imgError, setImgError] = useState(false)
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const introduction = useWatch({ control, name: 'introduction' })
  const nickname = useWatch({ control, name: 'nickname' })
  const profileImageUrl = useWatch({ control, name: 'profileImageUrl' })
  const titleLength = introduction?.length ?? 0

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp',
    }
    return await imageCompression(file, options)
  }

  const handleNicknameCheck = async () => {
    try {
      const response = await checkNickname(nickname)

      if (response.data) {
        setCheckResult({
          status: 'success',
          message: response.message,
        })
        setIsNicknameVerified(true)
        clearErrors('nickname')
      } else {
        setCheckResult({
          status: 'error',
          message: response.message,
        })
        setIsNicknameVerified(false)
      }
    } catch {
      setCheckResult({
        status: 'error',
        message: '닉네임 확인 중 오류가 발생했습니다.',
      })
      setIsNicknameVerified(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearErrors('profileImageUrl')

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('profileImageUrl', { type: 'manual', message: IMAGE_UPLOAD_ERRORS['file-invalid-type'] })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('profileImageUrl', { type: 'manual', message: IMAGE_UPLOAD_ERRORS['file-too-large'] })
      return
    }

    try {
      const compressedFile = await compressImage(file)
      const uploadedUrl = await uploadImage([compressedFile])
      setValue('profileImageUrl', uploadedUrl.mainImageUrl)
    } catch {
      setError('profileImageUrl', {
        type: 'manual',
        message: IMAGE_UPLOAD_ERRORS['upload-failed'],
      })
    }

    e.target.value = ''
  }

  const onSubmit = async (data: ProfileUpdateBaseFormValues) => {
    const isUnchanged =
      data.nickname === myData?.nickname &&
      data.birthDate === myData?.birthDate &&
      data.profileImageUrl === myData?.profileImageUrl &&
      data.introduction === myData?.introduction &&
      data.addressSido === myData?.addressSido &&
      data.addressGugun === myData?.addressGugun

    if (isUnchanged) {
      setUpdateWarning(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">변경사항이 없습니다.</p>
          <p>수정할 내용을 입력해주세요.</p>
        </div>
      )
      return
    }

    try {
      const response = await profileUpdate(data)
      if (response.code === 'SUCCESS') {
        updateUserProfile(data)
        setCheckResult({ status: 'idle', message: '' })
        await queryClient.refetchQueries({ queryKey: ['mypage', user?.id] })
        setUpdateSuccess(
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold">성공적으로 프로필을 수정했습니다.</p>
            <p>변경사항이 성공적으로 적용되었습니다.</p>
          </div>
        )
      }
    } catch {
      setUpdateError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">프로필 수정에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  useEffect(() => {
    if (myData) {
      reset({
        nickname: myData.nickname || '',
        birthDate: myData.birthDate || '',
        profileImageUrl: myData.profileImageUrl || '',
        introduction: myData.introduction || '',
        addressSido: (myData.addressSido as Province) || '',
        addressGugun: myData.addressGugun || '',
      })
    }
  }, [myData, reset])

  return (
    <form className="flex w-full flex-col gap-6 rounded-xl border border-gray-200 bg-white p-5 md:p-7" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-8">
        <legend className="sr-only">프로필 정보 수정 폼</legend>
        {isMd && (
          <div className="flex flex-col gap-2">
            <h2 className="heading-h3">기본 정보</h2>
            <p className="text-gray-500">프로필 이미지, 닉네임, 거주지를 수정할 수 있습니다</p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-10">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-28 w-28">
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" />
                <div className="bg-primary-50 relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full">
                  {profileImageUrl ? (
                    <Image
                      src={imgError ? profileImageUrl : toResizedWebpUrl(profileImageUrl, 150)}
                      loader={imgError ? undefined : imageLoader}
                      alt={myData?.nickname || '프로필 이미지'}
                      fill
                      sizes={IMAGE_SIZES.tinyThumbnail}
                      className="object-cover"
                      onError={() => setImgError(true)}
                      unoptimized={imgError}
                    />
                  ) : (
                    <div className="heading-h1 font-normal!">{myData?.nickname.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div
                  className="bg-primary-100 absolute right-0 bottom-2 flex size-8 cursor-pointer items-center justify-center rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="" size={20} />
                </div>
              </div>
              {errors.profileImageUrl && <p className="text-danger-500 text-xs font-semibold">{errors.profileImageUrl.message}</p>}
              <p className="text-sm">프로필 사진을 변경하려면 카메라 아이콘을 클릭하세요</p>
            </div>

            {/* 정보 영역 */}
            <div className="flex flex-col gap-8">
              {/* 본인 인증 정보 */}
              <div className="flex flex-col gap-3.5">
                <h3 className="heading-h5">본인 인증 정보</h3>

                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                  <div className="flex w-full flex-1 flex-col gap-1">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-gray-600">이름</span>
                      <div className="bg-primary-50/50 rounded-lg p-3 font-medium text-gray-400">{myData?.name}</div>
                    </div>
                    <p className="text-sm font-bold text-gray-400">본인 인증 정보로 변경할 수 없습니다.</p>
                  </div>

                  <div className="flex w-full flex-1 flex-col gap-1">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-gray-600">생년월일</span>
                      <div className="bg-primary-50/50 rounded-lg p-3 font-medium text-gray-400">{formatBirthDate(myData?.birthDate)}</div>
                    </div>
                    <p className="text-sm font-bold text-gray-400">본인 인증 정보로 변경할 수 없습니다.</p>
                  </div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="flex flex-col gap-3.5">
                <h3 className="heading-h5">계정 정보</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium text-gray-600">이메일</span>
                    <div className="bg-primary-50/50 rounded-lg p-3 font-medium text-gray-400">{myData?.email}</div>
                  </div>
                  <p className="text-sm font-bold text-gray-400">이메일은 변경할 수 없습니다.</p>
                </div>
              </div>

              {/* 활동 정보 */}
              <div className="flex flex-col gap-3.5">
                <h3 className="heading-h5">활동 정보</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col justify-center gap-2">
                    <RequiredLabel required={false}>닉네임</RequiredLabel>
                    <InputWithButton
                      id="update-nickname"
                      type="text"
                      placeholder="cuddle market"
                      registration={register('nickname', profileValidationRules.nickname)}
                      buttonText="중복체크"
                      size="text-base"
                      buttonSize="lg"
                      buttonClassName="bg-primary-200 text-white cursor-pointer font-semibold py-[13px]"
                      checkResult={checkResult}
                      onButtonClick={handleNicknameCheck}
                    />
                  </div>
                </div>
                <AddressField<ProfileUpdateBaseFormValues>
                  control={control}
                  setValue={setValue}
                  primaryName="addressSido"
                  secondaryName="addressGugun"
                  required={false}
                  layoutClass="gap-2"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-2">
                    <RequiredLabel required={false}>자기소개</RequiredLabel>
                    <textarea
                      id="profile-introduction"
                      placeholder="소개글을 작성해주세요"
                      className={cn(
                        'focus:border-primary-500 min-h-[7vh] w-full resize-none rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm placeholder:text-gray-400 focus:outline-none'
                      )}
                      {...register('introduction', profileValidationRules.introduction)}
                    />
                    <p className="text-sm font-semibold text-gray-400">{titleLength}/1000자</p>
                    {errors.introduction && <p className="text-danger-500 text-xs font-semibold"> {errors.introduction.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            <p className="border-t border-gray-300 pt-2.5 text-sm text-gray-400">
              본인 인증 정보의 변경이 필요한 경우, 고객센터 1:1 문의를 통해 문의주세요.
            </p>
            <AnimatePresence>
              {updateError && (
                <InlineNotification type="error" onClose={() => setUpdateError(null)}>
                  {updateError}
                </InlineNotification>
              )}
              {updateSuccess && (
                <InlineNotification type="success" onClose={() => setUpdateSuccess(null)}>
                  {updateSuccess}
                </InlineNotification>
              )}
              {updateWarning && (
                <InlineNotification type="warning" onClose={() => setUpdateWarning(null)}>
                  {updateWarning}
                </InlineNotification>
              )}
            </AnimatePresence>
          </div>
          <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="submit">
            프로필 수정
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
