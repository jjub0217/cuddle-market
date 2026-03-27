'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Calendar, Settings, Flag, Ban, LockOpen, ShieldAlert, Route } from 'lucide-react'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import { type Dispatch, type SetStateAction } from 'react'
import { formatJoinDate } from '@/lib/utils/formatJoinDate'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUserStore } from '@/store/userStore'

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
}

interface ProfileDataProps {
  data?: MyPageData
  setIsWithdrawModalOpen?: Dispatch<SetStateAction<boolean>>
  setIsReportModalOpen?: Dispatch<SetStateAction<boolean>>
  setIsBlockModalOpen?: Dispatch<SetStateAction<boolean>>
  handleUserUnBlocked?: (id: number) => void
  isMyProfile?: boolean
  unblockUser?: () => void
}

export default function ProfileData({
  setIsWithdrawModalOpen,
  setIsReportModalOpen,
  setIsBlockModalOpen,
  data,
  isMyProfile,
  unblockUser,
}: ProfileDataProps) {
  const user = useUserStore((state) => state.user)
  const isMd = useMediaQuery('(min-width: 768px)')
  const pathname = usePathname()
  const isProfileEditPage = pathname === '/profile-update'
  const formattedJoinDate = data?.createdAt ? formatJoinDate(data.createdAt) : ''

  const getProvider = (email: string | undefined) => {
    if (email?.includes('gmail')) return 'google'
    if (email?.includes('kakao')) return 'kakao'
    return '이메일' // 일반 회원
  }

  const provider = getProvider(user?.email)

  return (
    <aside aria-label="프로필" className="flex h-fit flex-col rounded-none border-b border-gray-200 bg-white px-5 py-5 md:max-w-72 md:min-w-72 md:rounded-xl md:border">
      <div className="text-text-primary sticky top-24 flex flex-col rounded-xl">
        <div className="flex flex-col gap-3 md:gap-6">
          <div className="flex flex-row items-center gap-3.5 md:flex-col">
            <div className="bg-primary-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full">
              {data?.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={toResizedWebpUrl(data.profileImageUrl, 150)}
                  srcSet={getImageSrcSet(data.profileImageUrl)}
                  sizes={IMAGE_SIZES.tinyThumbnail}
                  alt={data.nickname}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget
                    if (data.profileImageUrl && img.src !== data.profileImageUrl) {
                      img.srcset = ''
                      img.src = data.profileImageUrl
                    }
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="heading-h4">{data?.nickname.charAt(0).toUpperCase()}</div>
              )}
            </div>

            {isMd ? (
              // 데스크탑 공통 표시
              <div className="flex flex-col items-center gap-1">
                {!isMyProfile && data?.isBlocked ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    <ShieldAlert size={12} />
                    차단 유저
                  </span>
                ) : null}
                <p className="heading-h5 text-text-primary">{data?.nickname}</p>
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
                <p className="text-sm font-normal text-gray-500">{formattedJoinDate} 가입</p>
              </div>
            )}
          </div>
          <p className="w-full text-sm font-normal text-gray-500">{data?.introduction || '소개글을 작성해주세요'}</p>
          {/* 데스크탑 내 정보 */}
          {isMyProfile ? (
            <>
              <div className="flex flex-col gap-3.5">
                {isMd ? (
                  <div className="flex flex-col gap-2.5">
                    <ProductMetaItem
                      icon={MapPin}
                      iconSize={17}
                      strokeWidth={1}
                      label={`${data?.addressSido} ${data?.addressGugun}`}
                      className="gap-2"
                      textClassName="text-sm font-normal"
                    />
                    <ProductMetaItem icon={Calendar} iconSize={17} strokeWidth={1} label={`가입일: ${formattedJoinDate}`} className="gap-2" textClassName="text-sm font-normal" />
                    <ProductMetaItem icon={Route} iconSize={17} strokeWidth={1} label={`가입 경로: ${provider}`} className="gap-2" textClassName="text-sm font-normal" />
                  </div>
                ) : null}
                {!isProfileEditPage ? (
                  <Link
                    href={ROUTES.PROFILE_UPDATE}
                    className="bg-primary-200 flex items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-white transition-all"
                  >
                    <Settings size={19} />
                    <span className="text-sm font-semibold">내 정보 수정</span>
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                className="w-full cursor-pointer border-gray-300 pb-0 text-right text-xs text-gray-500 hover:underline md:border-t md:pt-6 md:text-left"
                onClick={() => setIsWithdrawModalOpen?.(true)}
              >
                회원탈퇴
              </button>
            </>
          ) : null}

          {/* 다른 유저 프로필 */}
          {!isMyProfile ? (
            <>
              <div className="flex items-center justify-between gap-[15px]">
                {data?.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => unblockUser?.()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-100/50 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 md:bg-transparent md:py-1.5 md:text-gray-500 md:hover:bg-gray-100"
                  >
                    <LockOpen size={16} />
                    차단 해제
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-100/50 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 md:bg-transparent md:py-1.5 md:text-gray-500 md:hover:bg-gray-100"
                    onClick={() => setIsBlockModalOpen?.(true)}
                  >
                    <Ban size={16} />
                    차단하기
                  </button>
                )}

                {data?.isReported ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100/50 px-3 py-2 text-sm text-gray-500 md:py-1.5">
                    <Flag size={16} />
                    <span>신고완료</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-100/50 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 md:bg-transparent md:py-1.5 md:text-gray-500 md:hover:bg-gray-100"
                    onClick={() => setIsReportModalOpen?.(true)}
                  >
                    <Flag size={16} />
                    신고하기
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
