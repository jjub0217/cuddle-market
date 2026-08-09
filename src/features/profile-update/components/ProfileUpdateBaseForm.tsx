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
import { fetchGraphQL } from '@/lib/api/graphql'
import { useState, useEffect, useRef } from 'react'
import { useUserStore } from '@/store/userStore'
import { uploadImage } from '@/lib/api/products'
import { useQueryClient } from '@tanstack/react-query'
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
  onWithdrawClick: () => void
}
export default function ProfileUpdateBaseForm({ myData, onWithdrawClick }: ProfileUpdateBaseFormProps) {
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
      const { checkNickname: response } = await fetchGraphQL<{ checkNickname: { available: boolean; message: string } }>(
        `
        query CheckNickname($nickname: String!) {
          checkNickname(nickname: $nickname) { available message }
        }
      `,
        { nickname }
      )

      if (response.available) {
        setCheckResult({ status: 'success', message: response.message })
        clearErrors('nickname')
      } else {
        setCheckResult({ status: 'error', message: response.message })
      }
    } catch {
      setCheckResult({ status: 'error', message: '닉네임 확인 중 오류가 발생했습니다.' })
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
      const { updateProfile: response } = await fetchGraphQL<{ updateProfile: { success: boolean; code: string } }>(
        `
        mutation UpdateProfile($input: ProfileUpdateInput!) {
          updateProfile(input: $input) { success code }
        }
      `,
        { input: data }
      )
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
    <form
      className="flex w-full flex-col gap-6 rounded-xl border border-gray-200 bg-white p-5 md:p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <fieldset className="flex flex-col gap-8">
        <legend className="sr-only">프로필 정보 수정 폼</legend>
        {/* 예전에는 밑에 「프로필 이미지, 닉네임, 거주지를 수정할 수 있습니다」가 있었다.
            뺀 이유: ① 바로 아래에 그 칸들이 그대로 보인다 ② **자기소개가 빠져 있어 틀렸다**.
            「무엇무엇을 할 수 있다」고 나열하는 안내는 칸이 늘면 조용히 거짓말이 된다 */}
        <div className="flex flex-col">
          <h2 className="text-[17.5px] font-semibold">기본 정보</h2>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-10">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {/* ⚠️ **사진 동그라미까지 통째로 단추다.** 예전에는 카메라 아이콘만 눌렸는데
                  동그라미에도 cursor-pointer 가 붙어 있어, 손 모양이 뜨는데도 눌리지 않았다.
                  「누를 수 있다」고 해 놓고 안 되면 안 눌리는 것보다 나쁘다.
                  ⚠️ 폼 안이라 type="button" 이 **반드시** 있어야 한다. 없으면 submit 이 된다.
                  ⚠️ 파일 입력칸은 이 단추 **밖**에 둔다 — 단추 안의 input 은 못 쓰는 마크업이다 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="프로필 사진 변경"
                className="group relative h-28 w-28 cursor-pointer"
              >
                <div className="bg-primary-50 relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
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
                {/* 카메라는 이제 **표시일 뿐**이다. 단추가 바깥이라 여기까지 눌린다.
                    group-hover 로 동그라미 어디에 올려도 아이콘이 같이 밝아진다 */}
                <span className="bg-primary-100 group-hover:bg-primary-200 absolute right-0 bottom-2 flex size-8 items-center justify-center rounded-full transition-colors">
                  <Camera size={20} />
                </span>
              </button>
              {errors.profileImageUrl ? (
                <p className="text-danger-500 text-xs font-semibold">{errors.profileImageUrl.message}</p>
              ) : null}
              <p className="text-xs text-gray-500">프로필 사진을 클릭하면 변경할 수 있습니다</p>
            </div>

            {/* 정보 영역 */}
            <div className="flex flex-col gap-8">
              {/* ⚠️ **못 고치는 값 셋 + 안내를 한 묶음으로 묶는다.**
                  묶기 전에는 셋이 바깥 gap-8(32px)의 형제라 이름행과 이메일 사이가 32px로
                  벌어졌고, 안내를 값에 붙이려고 -mt-6(-24px)을 줘서 **gap 과 싸우고 있었다.**
                  묶어 두면 바깥 32px 은 「못 고치는 값 ↔ 활동 정보」를 가르는 데만 쓰이고,
                  안쪽은 gap-3.5(14px) 하나로 정해진다 — 밑의 활동 정보와 같은 간격이라
                  폼 전체의 세로 리듬이 하나가 된다. 음수 여백은 없앴다 */}
              <div className="flex flex-col gap-3.5">
                {/* 본인 인증 정보 */}
                <div className="flex flex-col gap-1 md:gap-1">
                  {/* <h3 className="md:heading-h5 text-base font-semibold">본인 인증 정보</h3> */}

                  {/* ⚠️ **좁은 화면에서도 나란히 둔다.** 예전에는 md 미만에서 세로로 쌓였는데,
                      짧은 값 둘이 화면을 길게 잡아먹어 정작 고칠 칸이 아래로 밀렸다.
                      간격만 폭에 따라 가른다 — 좁은 데서 24px 은 두 칸의 폭을 너무 깎는다.
                      앱도 같은 짜임이다(mobile/app/profile-edit.tsx 의 readOnlyPair) */}
                  <div className="flex flex-row items-start justify-between gap-3 md:gap-6">
                    <div className="flex w-full flex-1 flex-col gap-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-600">이름</span>
                        {/* ⚠️ 좁은 화면에서는 400(font-normal). 고칠 수 있는 칸의 글자보다
                            가벼워야 「읽기만 하는 값」이라는 게 굵기로도 드러난다. 앱도 400 이다 */}
                        <div className="bg-primary-50/50 rounded-lg px-3 py-2.5 text-sm font-normal text-gray-400 md:font-medium">
                          {myData?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-1 flex-col gap-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-600">생년월일</span>
                        <div className="bg-primary-50/50 rounded-lg px-3 py-2.5 text-sm font-normal text-gray-400 md:font-medium">
                          {formatBirthDate(myData?.birthDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⚠️ **폭에 상관없이 여기 있다.** 예전에는 md:hidden 이라 좁은 화면에만 있고
                  데스크탑에서는 옆 칸에 넣기로 했는데 옮기다 말아 **어디에도 없었다.**
                  이제 이름·생년월일과 한자리에 모아 두니 아래 안내 한 줄이 셋을 다 가리킨다.
                  ⚠️ 옆 칸(ProfileData)은 이 화면에서 이메일을 **안 그린다** — 한 화면에 두 번
                  나오면 안 된다. 거기서 isProfileEditPage 로 가른다.
                  ⚠️ 「계정 정보」 제목을 뺐다. 제목이 중간에서 끊으면 「위 정보」가 어디까지인지
                  흐려진다. 짝인 「본인 인증 정보」 제목도 이미 주석 처리돼 안 보이고,
                  앱도 제목 없이 세 줄만 둔다(mobile/app/profile-edit.tsx) */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-600">이메일</span>
                  {/* 굵기는 위 둘과 같이 간다 — 셋이 한 묶음이라 하나만 굵으면 어긋나 보인다 */}
                  <div className="bg-primary-50/50 rounded-lg px-3 py-2.5 text-sm font-normal text-gray-400 md:font-medium">
                    {myData?.email}
                  </div>
                </div>

                {/* ⚠️ **가리키는 값 바로 밑에 둔다.** 예전에는 자기소개 뒤 맨 아래에 있었는데,
                  거기서는 무엇을 말하는지 알 수가 없어 「이름·생년월일·이메일은…」이라고
                  값을 일일이 불러야 했다. 그 나열이 데스크탑에서 어긋났다 —
                  이메일 묶음이 md:hidden 이라 **없는 것을 있다고 말하고 있었다.**
                  자리를 옮기니 나열이 필요 없어지고, 화면마다 보이는 것이 달라도 안 틀린다.
                  ⚠️ 「무엇무엇은 …」식 나열은 화면이 바뀌면 조용히 거짓말이 된다. 이 화면에서만
                  두 번 겪었다(뺀 「프로필 이미지, 닉네임, 거주지를 수정할 수 있습니다」도 같다).
                  ⚠️ 좁은 화면에서는 두 줄로 끊는다 — 「무엇이 안 되나」와 「그럼 어떻게 하나」는
                  다른 이야기인데 폭이 좁으면 한 덩어리로 뭉쳐 읽힌다. 앱도 두 줄이다
                  (mobile/app/profile-edit.tsx) */}
                <p className="text-xs text-gray-400">
                  <span className="block md:inline">위 정보는 변경할 수 없습니다.</span>{' '}
                  <span className="block md:inline">변경이 필요하면 고객센터 1:1 문의로 알려주세요.</span>
                </p>
              </div>

              {/* 활동 정보 */}
              <div className="flex flex-col gap-3.5">
                {/* <h3 className="md:heading-h5 text-base font-semibold">활동 정보</h3> */}
                <div className="flex flex-col gap-1 md:-mt-2.5">
                  <div className="flex flex-col justify-center gap-1">
                    <RequiredLabel htmlFor="update-nickname" required={false} labelClass="text-sm">
                      닉네임
                    </RequiredLabel>
                    <InputWithButton
                      id="update-nickname"
                      type="text"
                      placeholder="cuddle market"
                      registration={register('nickname', profileValidationRules.nickname)}
                      buttonText="중복체크"
                      buttonSize="md"
                      buttonClassName="bg-primary-200 text-sm text-white cursor-pointer font-semibold py-[10px] !h-auto"
                      inputClass="md:py-[10px]"
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
                  layoutClass="gap-1"
                  labelClass="text-sm"
                  buttonClassName="py-[10px]"
                />
                <div className="flex flex-col gap-1">
                  <div className="gap- flex flex-col">
                    <RequiredLabel htmlFor="profile-introduction" required={false} labelClass="text-sm">
                      자기소개
                    </RequiredLabel>
                    <textarea
                      id="profile-introduction"
                      placeholder="소개글을 작성해주세요"
                      className={cn(
                        'focus:border-primary-500 min-h-[7vh] w-full resize-none rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm placeholder:text-sm placeholder:text-gray-400 focus:outline-none'
                      )}
                      {...register('introduction', profileValidationRules.introduction)}
                    />
                    <p className="text-xs font-semibold text-gray-400">{titleLength}/200자</p>
                    {errors.introduction ? (
                      <p className="text-danger-500 text-xs font-semibold"> {errors.introduction.message}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {updateError ? (
                <InlineNotification type="error" onClose={() => setUpdateError(null)}>
                  {updateError}
                </InlineNotification>
              ) : null}
              {updateSuccess ? (
                <InlineNotification type="success" onClose={() => setUpdateSuccess(null)}>
                  {updateSuccess}
                </InlineNotification>
              ) : null}
              {updateWarning ? (
                <InlineNotification type="warning" onClose={() => setUpdateWarning(null)}>
                  {updateWarning}
                </InlineNotification>
              ) : null}
            </AnimatePresence>
          </div>
          <Button
            size="md"
            className="bg-primary-600 hover:bg-primary-700 w-full cursor-pointer text-white transition-colors"
            type="submit"
          >
            프로필 수정
          </Button>
        </div>
        <Button
          size="md"
          type="button"
          onClick={onWithdrawClick}
          className="w-auto cursor-pointer bg-transparent text-xs text-gray-400 md:ml-auto"
        >
          회원탈퇴
        </Button>
      </fieldset>
    </form>
  )
}
