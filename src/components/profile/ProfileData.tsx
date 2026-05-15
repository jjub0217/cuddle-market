'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, Flag, Ban, LockOpen, ShieldAlert, EllipsisVertical } from 'lucide-react'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUserStore } from '@/store/userStore'
import IconButton from '@/components/commons/button/IconButton'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Z_INDEX } from '@/constants/ui'
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
}

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
}: ProfileDataProps) {
  const user = useUserStore((state) => state.user)
  const updateUserProfile = useUserStore((state) => state.updateUserProfile)
  const queryClient = useQueryClient()
  const isMd = useMediaQuery('(min-width: 768px)')
  const pathname = usePathname()
  const isProfileEditPage = pathname === '/profile-update'

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isMoreMenuOpen, [moreMenuRef], () => setIsMoreMenuOpen(false))

  const menuItemClass =
    'flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors'

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

      const { updateProfile: response } = await fetchGraphQL<{ updateProfile: { success: boolean; code: string } }>(
        `mutation UpdateProfile($input: ProfileUpdateInput!) { updateProfile(input: $input) { success code } }`,
        { input: { profileImageUrl: nextUrl } }
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

  return (
    <aside
      aria-label="프로필"
      className="bg-surface/95 border-outline-variant/40 flex h-fit flex-col rounded-none border-b px-5 py-5 md:max-w-72 md:min-w-72 md:rounded-xl md:border"
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
            <div ref={moreMenuRef} className="absolute top-0 right-0 z-10">
              <IconButton
                size="sm"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                aria-label="유저 옵션 메뉴 열기"
                aria-haspopup="menu"
                aria-expanded={isMoreMenuOpen}
              >
                <EllipsisVertical size={16} className="text-gray-500" />
              </IconButton>
              {isMoreMenuOpen ? (
                <div
                  role="menu"
                  className={cn(
                    'border-outline-variant/60 absolute top-9 right-0 flex flex-col overflow-hidden rounded-lg border bg-white shadow-md',
                    Z_INDEX.DROPDOWN
                  )}
                >
                  {data?.isBlocked ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => {
                        unblockUser?.()
                        setIsMoreMenuOpen(false)
                      }}
                    >
                      <LockOpen size={16} />
                      <span>차단 해제</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => {
                        setIsBlockModalOpen?.(true)
                        setIsMoreMenuOpen(false)
                      }}
                    >
                      <Ban size={16} />
                      <span>차단하기</span>
                    </button>
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
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => {
                        setIsReportModalOpen?.(true)
                        setIsMoreMenuOpen(false)
                      }}
                    >
                      <Flag size={16} />
                      <span>신고하기</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-row items-center gap-3.5">
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
              </div>
            )}
          </div>
          <div className="flex w-full flex-col gap-1">
            <p
              ref={introRef}
              className={cn(
                'w-full text-sm font-normal break-words whitespace-pre-wrap text-gray-500',
                !isIntroExpanded && 'line-clamp-3'
              )}
            >
              {data?.introduction || '소개글을 작성해주세요'}
            </p>
            {data?.introduction && (isIntroExpanded || isIntroClamped) ? (
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
