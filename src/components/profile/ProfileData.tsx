'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, Flag, Ban, LockOpen, ShieldAlert, EllipsisVertical } from 'lucide-react'
import { formatJoinDate } from '@cuddle/shared'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUserStore } from '@/store/userStore'
import IconButton from '@/components/commons/button/IconButton'
import { DropdownMenu, DropdownMenuItem } from '@/components/commons/DropdownMenu'
import { cn } from '@/lib/utils/cn'
import { uploadImage } from '@/lib/api/products'
import { fetchGraphQL } from '@/lib/api/graphql'
import imageCompression from 'browser-image-compression'
import { useQueryClient } from '@tanstack/react-query'
import InlineNotification from '@/components/commons/InlineNotification'
import { AnimatePresence } from 'framer-motion'

export interface ProfileSummaryCounts {
  sales: number
  purchases: number
  wishlist: number
}

export interface MyPageData {
  id: number
  profileImageUrl?: string
  nickname: string
  name?: string
  introduction?: string
  birthDate?: string
  email?: string
  addressSido: string
  addressGugun: string
  createdAt: string
  isBlocked?: boolean
  isReported?: boolean
  provider?: 'LOCAL' | 'GOOGLE' | 'KAKAO'
}

interface ProfileDataProps {
  data?: MyPageData
  setIsWithdrawModalOpen?: Dispatch<SetStateAction<boolean>>
  setIsReportModalOpen?: Dispatch<SetStateAction<boolean>>
  setIsBlockModalOpen?: Dispatch<SetStateAction<boolean>>
  handleUserUnBlocked?: (id: number) => void
  isMyProfile?: boolean
  unblockUser?: () => void
  summaryCounts?: ProfileSummaryCounts
  enableImageUpload?: boolean
  showJoinDate?: boolean
}

// 가입일 모양은 packages/shared 로 옮겼다. 앱의 남의 프로필도 같은 함수를 쓴다 —
// 여기 갇혀 있던 탓에 앱은 가입일을 아예 못 그렸다(생년월일도 같은 이유로 갈렸었다).

const SUMMARY_ITEMS: Array<{ key: keyof ProfileSummaryCounts; label: string }> = [
  { key: 'sales', label: '판매내역' },
  { key: 'purchases', label: '구매내역' },
  { key: 'wishlist', label: '찜한 상품' },
]

export default function ProfileData({
  data,
  isMyProfile,
  setIsReportModalOpen,
  setIsBlockModalOpen,
  unblockUser,
  summaryCounts,
  enableImageUpload,
  showJoinDate,
}: ProfileDataProps) {
  const user = useUserStore((state) => state.user)
  const updateUserProfile = useUserStore((state) => state.updateUserProfile)
  const queryClient = useQueryClient()
  const isMd = useMediaQuery('(min-width: 768px)')
  const pathname = usePathname()
  const isProfileEditPage = pathname === '/profile-update'

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null)

  /** 앞뒤 공백을 뗀 소개글. 공백만 있으면 「없다」와 같게 다룬다 */
  const introduction = data?.introduction?.trim() ?? ''

  // 웹·앱이 같은 함수를 쓴다. 날짜로 못 읽으면 빈 글자가 와서 줄을 안 그린다
  const joinDate = formatJoinDate(data?.createdAt)

  const introRef = useRef<HTMLParagraphElement>(null)
  const [isIntroExpanded, setIsIntroExpanded] = useState(false)
  const [isIntroClamped, setIsIntroClamped] = useState(false)
  useEffect(() => {
    if (!introRef.current || isIntroExpanded) return
    setIsIntroClamped(introRef.current.scrollHeight > introRef.current.clientHeight + 1)
  }, [data?.introduction, isIntroExpanded])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImageUrl, setProfileImageUrl] = useState(data?.profileImageUrl || '')
  const [prevDataImageUrl, setPrevDataImageUrl] = useState(data?.profileImageUrl || '')
  const [imgError, setImgError] = useState(false)
  const [imageUpdateError, setImageUpdateError] = useState<React.ReactNode | null>(null)
  const nextDataImageUrl = data?.profileImageUrl || ''
  if (nextDataImageUrl !== prevDataImageUrl) {
    setPrevDataImageUrl(nextDataImageUrl)
    setProfileImageUrl(nextDataImageUrl)
    setImgError(false)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setImageUpdateError(<p className="text-base font-semibold">지원하지 않는 파일 형식입니다.</p>)
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageUpdateError(<p className="text-base font-semibold">파일 크기는 5MB를 초과할 수 없습니다.</p>)
      e.target.value = ''
      return
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/webp',
      })
      const uploaded = await uploadImage([compressed])
      const nextUrl = uploaded.mainImageUrl

      // ⚠️ **사진만 보내면 안 된다.** 두 가지가 걸린다.
      //    ① 닉네임이 필수다(ProfileUpdateRequest.java 의 @NotBlank) — 빼면 400 이 난다.
      //       실제로 ?panel=profile 에서 사진 변경이 계속 실패했다(/profile-update 는
      //       폼 전체를 보내서 통과했다).
      //    ② 서버는 **전체 교체**다(User.java:225-240 — 받은 값을 조건 없이 그대로 넣는다).
      //       안 보낸 지역·소개글이 null 로 덮여 **지워진다.**
      //    그래서 지금 값을 다 실어 보내고 사진만 갈아 끼운다.
      const { updateProfile: response } = await fetchGraphQL<{ updateProfile: { success: boolean; code: string } }>(
        `mutation UpdateProfile($input: ProfileUpdateInput!) { updateProfile(input: $input) { success code } }`,
        {
          input: {
            nickname: data.nickname,
            birthDate: data.birthDate,
            addressSido: data.addressSido,
            addressGugun: data.addressGugun,
            introduction: data.introduction,
            profileImageUrl: nextUrl,
          },
        }
      )

      if (response.code === 'SUCCESS') {
        setProfileImageUrl(nextUrl)
        setImgError(false)
        setImageUpdateError(null)
        updateUserProfile({ profileImageUrl: nextUrl })
        await queryClient.refetchQueries({ queryKey: ['mypage', user?.id] })
      }
    } catch {
      setImageUpdateError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">프로필 이미지 변경에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
    e.target.value = ''
  }

  // ⚠️ **좁은 화면에서는 좌우 16px 이다**(#965). 헤더 로고도 16 이라 글자가 한 줄로 선다.
  //    예전에는 20 이라 4px 어긋났다. 값은 `PAGE_CONTAINER`(px-4)와 같은 16px 이다.
  //
  // ⚠️ **띠 자체는 화면 끝까지 차야 한다.** 좁은 화면에서 이 상자는 배경이 흰 띠이고
  //    아래에 구분선(border-b)이 그어진다. 바깥 상자에 여백을 주면 띠와 선이 양옆에서
  //    잘린다 — 그래서 **안쪽 여백만** 옮겼다.
  //
  // ⚠️ `md:px-5` 는 데스크탑 카드 안쪽 여백이라 20 그대로 둔다. 거기는 「로고와 한 줄」이
  //    아니라 「카드 안쪽 숨통」이라 질문이 다르다.
  return (
    <aside
      aria-label="프로필"
      className="md:bg-surface/95 border-outline-variant/40 flex h-fit flex-col border-b bg-white px-4 py-5 md:max-w-72 md:min-w-72 md:rounded-xl md:border md:border-b md:px-5"
    >
      <AnimatePresence>
        {imageUpdateError ? (
          <InlineNotification type="error" onClose={() => setImageUpdateError(null)}>
            {imageUpdateError}
          </InlineNotification>
        ) : null}
      </AnimatePresence>
      <div className="text-text-primary sticky top-24 flex flex-col rounded-xl">
        <div className="relative flex flex-col gap-3 md:gap-6">
          {!isMyProfile ? (
            <div className="absolute top-0 right-0 z-10">
              <IconButton
                ref={moreMenuButtonRef}
                size="sm"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                aria-label="유저 옵션 메뉴 열기"
                aria-haspopup="menu"
                aria-expanded={isMoreMenuOpen}
              >
                <EllipsisVertical size={16} className="text-gray-500" />
              </IconButton>
              <DropdownMenu
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                triggerRef={moreMenuButtonRef}
                label="유저 옵션 메뉴"
              >
                {data?.isBlocked ? (
                  <DropdownMenuItem
                    onClick={() => {
                      unblockUser?.()
                      setIsMoreMenuOpen(false)
                    }}
                  >
                    <LockOpen size={16} />
                    <span>차단 해제</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsBlockModalOpen?.(true)
                      setIsMoreMenuOpen(false)
                    }}
                  >
                    <Ban size={16} />
                    <span>차단하기</span>
                  </DropdownMenuItem>
                )}
                {data?.isReported ? (
                  <div
                    role="menuitem"
                    aria-disabled="true"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap text-gray-400"
                  >
                    <Flag size={16} />
                    <span>신고완료</span>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsReportModalOpen?.(true)
                      setIsMoreMenuOpen(false)
                    }}
                  >
                    <Flag size={16} />
                    <span>신고하기</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenu>
            </div>
          ) : null}
          {/* ⚠️ **줄 수에 따라 맞춤이 갈린다.** 오른쪽 열이 사진(56px)보다 긴지 짧은지로 갈린다.

              가입일 있음  닉네임·주소·가입일  3줄 ≈ 68px  >  사진   → items-start
                          가운데로 맞추면 사진이 아래로 밀려 닉네임과 눈높이가 어긋난다
              가입일 없음  닉네임·주소        2줄 ≈ 42px  <  사진   → items-center
                          위로 맞추면 글자 아래가 비어 위쪽만 무거워 보인다

              지금은 남의 프로필만 가입일을 그린다(UserPage 에서만 showJoinDate 를 넘긴다).
              마이페이지·프로필 수정 옆 칸은 두 줄이다. */}
          <div className={cn('flex flex-row gap-3.5', showJoinDate ? 'items-start' : 'items-center')}>
            <div className="relative h-14 w-14 shrink-0">
              {enableImageUpload ? (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              ) : null}
              <div className="bg-primary-50 flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgError ? profileImageUrl : toResizedWebpUrl(profileImageUrl, 150)}
                    srcSet={getImageSrcSet(profileImageUrl)}
                    sizes={IMAGE_SIZES.smallThumbnail}
                    alt={data?.nickname || '프로필 이미지'}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (profileImageUrl && img.src !== profileImageUrl) {
                        img.srcset = ''
                        img.src = profileImageUrl
                        return
                      }
                      setImgError(true)
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-xl font-semibold">{data?.nickname.charAt(0).toUpperCase()}</div>
                )}
              </div>
              {enableImageUpload ? (
                <button
                  type="button"
                  className="bg-primary-100 hover:bg-primary-200 absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full shadow-sm transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="프로필 사진 변경"
                >
                  <Camera size={16} />
                </button>
              ) : null}
            </div>

            {isMd ? (
              // 데스크탑 공통 표시
              <div className="flex flex-col items-start gap-2">
                {!isMyProfile && data?.isBlocked ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    <ShieldAlert size={12} />
                    차단 유저
                  </span>
                ) : null}
                <p className="text-text-primary text-base leading-none font-semibold">{data?.nickname}</p>
                <p className="text-text-primary text-sm leading-none">{`${data?.addressSido} ${data?.addressGugun}`}</p>
                {/* ⚠️ **지역 바로 밑이다. 소개글 뒤가 아니다.** 소개글 뒤에 두면 붕 뜬다 —
                    소개글은 「그 사람이 쓴 말」이고 가입일은 「계정에 대한 사실」이라
                    성격이 다른데, 비슷한 회색 글자가 이어지니 소개글의 둘째 문단처럼
                    읽히다가 아닌 걸 알게 된다. 지역과 같은 종류라 거기 붙어야 한다 */}
                {showJoinDate && joinDate ? <p className="text-[13px] leading-none text-gray-500">{joinDate} 가입</p> : null}
              </div>
            ) : (
              // 모바일 내 정보
              <div>
                <div className="flex items-center gap-2 pb-0.5">
                  <p className="heading-h5 text-text-primary">{data?.nickname}</p>
                  {!isMyProfile && data?.isBlocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      <ShieldAlert size={12} />
                      차단 유저
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-normal text-gray-500">
                  {data?.addressSido} {data?.addressGugun}
                </p>
                {/* 데스크탑 쪽과 같은 이유로 지역 바로 밑이다 */}
                {showJoinDate && joinDate ? <p className="mt-0.5 text-[13px] text-gray-500">{joinDate} 가입</p> : null}
              </div>
            )}
          </div>
          {/* 소개글.
              비어 있을 때 「소개글을 작성해주세요」는 내 프로필에서만 뜬다 —
              **문구가 갈린다.**
                내 프로필   「소개글을 작성해주세요」  그 자리가 곧 쓰러 가는 길이다
                남의 프로필 「소개글이 없습니다」      사실을 적는다

              ⚠️ 남에게 「작성해주세요」라고 하면 안 된다 — 누구더러 쓰라는 건지 알 수 없다.
                 예전에는 그래서 남의 프로필이면 **아예 안 그렸는데**, 빈 자리가 허전해
                 문구를 갈라 두 문제를 다 푼다(앱도 같다 —
                 mobile/components/user-profile/profile-head.tsx).

              공백만 있는 소개글도 「없다」로 본다. 저장할 때 앞뒤 공백을 안 떼고
              최소 2자만 보기 때문에(authValidationRules.introduction) 공백 두 칸도
              저장된다. 그걸 그대로 그리면 남의 프로필에 빈 줄이 생긴다. */}
          <div className="flex w-full flex-col gap-1">
            <p
              ref={introRef}
              className={cn(
                'w-full text-sm font-normal break-words whitespace-pre-wrap',
                introduction ? 'text-gray-500' : 'text-gray-400',
                !isIntroExpanded && 'line-clamp-3'
              )}
            >
              {introduction || (isMyProfile ? '소개글을 작성해주세요' : '소개글이 없습니다')}
            </p>
            {introduction && (isIntroExpanded || isIntroClamped) ? (
              <button
                type="button"
                onClick={() => setIsIntroExpanded((prev) => !prev)}
                className="cursor-pointer self-start text-xs text-gray-400 hover:underline"
                aria-expanded={isIntroExpanded}
              >
                {isIntroExpanded ? '접기' : '더보기'}
              </button>
            ) : null}
          </div>
          {/* ⚠️ **이메일은 여기서 안 그린다. 어느 화면에서도.**
              볼 자리는 프로필 수정 폼 하나뿐이다(ProfileUpdateBaseForm — 폭에 상관없이 그린다).
              세 쓰임이 다 안 그리는 쪽이다:
                남의 프로필      개인정보다. 남이 볼 이유가 없다
                프로필 수정 옆 칸  폼 안에 있다. 한 화면에 두 번 나오면 안 된다
                마이페이지 옆 칸   내 계정을 확인하는 자리는 프로필 수정으로 모은다

              ⚠️ MyPageData 에 email 프로퍼티가 남아 있고 「데스크탑에서는 사이드바에 표시」라는
                 옛 주석도 있어 **여기 그리고 싶어지는 자리다.** 그리면 시험 셋이 잡는다.
                 서버에서도 남의 프로필 응답에서 뺐다(cmarket_api d42f71d). */}
          {/* ⚠️ **선도 이름표도 없다.** 처음엔 「가입일 ↔ 2023.04.12」에 구분선을 그었는데,
              그건 설정 화면처럼 값이 여럿 나열될 때 쓰는 짜임이라 한 줄만 있으면 떠 보였다.
              「가입」이라는 말꼬리가 붙어 있어 이름표도 따로 필요 없다.
              ⚠️ **자기 줄을 갖는다.** 지역 줄에 「서울 은평구 · 2023.04.12 가입」으로 이어
              붙이는 안도 있었지만, 이 옆 칸이 max-w-72(288px)라 가장 긴 지역명
              (제주특별자치도 서귀포시)에서 넘친다. 앱도 같은 모양이다(profile-head.tsx) */}
          {/* 가입일은 위 닉네임·지역 묶음으로 옮겼다. 여기(소개글 뒤)에 두니 붕 떴다.
              ⚠️ 색으로도 한 번 헤맸다 — text-on-surface-muted 는 이름과 달리 **갈색**이다
                 (tokens.colors.css:15 — rgba(99,63,0,.85)). 회색인 줄 알고 쓰면 튄다 */}
          {isMyProfile && summaryCounts ? (
            <div className="border-outline-variant/40 grid grid-cols-3 gap-2 border-t pt-4">
              {SUMMARY_ITEMS.map((item) => (
                <div key={item.key} className="flex flex-col items-center gap-1">
                  <span className="text-on-surface-variant text-[13px]">{item.label}</span>
                  <strong className="text-on-surface text-base font-bold">{summaryCounts[item.key]}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {isMyProfile && !isProfileEditPage ? (
            <Link
              href={ROUTES.PROFILE_UPDATE}
              className="bg-primary-100 text-on-surface-variant hover:bg-primary-200 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition-colors"
            >
              프로필 수정
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
