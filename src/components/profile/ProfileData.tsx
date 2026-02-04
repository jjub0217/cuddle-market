'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { MapPin, Calendar, Settings, Flag, Ban, LockOpen, ShieldAlert, Route } from 'lucide-react'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import { formatJoinDate } from '@/lib/utils/formatJoinDate'
import { Button } from '@/components/commons/button/Button'
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
  const isProfileEditPage = /^\/profile-update$/.test(pathname)
  const formattedJoinDate = data?.createdAt ? formatJoinDate(data.createdAt) : ''
  const [imgError, setImgError] = useState(false)

  const getProvider = (email: string | undefined) => {
    if (email?.includes('gmail')) return 'google'
    if (email?.includes('kakao')) return 'kakao'
    return '이메일' // 일반 회원
  }

  const provider = getProvider(user?.email)

  return (
    <section className="flex h-fit flex-col rounded-none border-b border-gray-200 px-5 py-0 pt-5 md:max-w-72 md:min-w-72 md:rounded-xl md:border md:py-5">
      <div className="text-text-primary sticky top-24 flex flex-col rounded-xl">
        <div className="flex flex-col gap-3 md:gap-6">
          <div className="flex flex-row items-center gap-3.5 md:flex-col">
            <div className="bg-primary-50 relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full">
              {data?.profileImageUrl ? (
                <Image
                  src={imgError ? data.profileImageUrl : toResizedWebpUrl(data.profileImageUrl, 150)}
                  loader={imgError ? undefined : imageLoader}
                  sizes={IMAGE_SIZES.tinyThumbnail}
                  alt={data.nickname}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                  unoptimized={imgError}
                />
              ) : (
                <div className="heading-h4">{data?.nickname.charAt(0).toUpperCase()}</div>
              )}
            </div>

            {isMd ? (
              // 데스크탑 공통 표시
              <h3 className="heading-h5 text-text-primary">{data?.nickname}</h3>
            ) : (
              // 모바일 내 정보
              <div>
                <h3 className="heading-h5 text-text-primary pb-0.5">{data?.nickname}</h3>
                <p className="text-sm font-semibold text-gray-500">
                  {data?.addressSido} {data?.addressGugun}
                </p>
                <p className="text-sm font-semibold text-gray-500">{formattedJoinDate} 가입</p>
              </div>
            )}
          </div>
          <p className="w-full text-sm font-semibold text-gray-500">{data?.introduction || '소개글을 작성해주세요'}</p>
          {/* 데스크탑 내 정보 */}
          {isMyProfile && (
            <>
              <div className="flex flex-col gap-3.5">
                {isMd && (
                  <div className="flex flex-col gap-2.5">
                    <ProductMetaItem icon={MapPin} iconSize={17} label={`${data?.addressSido} ${data?.addressGugun}`} className="gap-2" />
                    <ProductMetaItem icon={Calendar} iconSize={17} label={`가입일: ${formattedJoinDate}`} className="gap-2" />
                    <ProductMetaItem icon={Route} iconSize={17} label={`가입 경로: ${provider}`} className="gap-2" />
                  </div>
                )}
                {!isProfileEditPage && (
                  <Link
                    href={ROUTES.PROFILE_UPDATE}
                    className="bg-primary-200 flex items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-white transition-all"
                  >
                    <Settings size={19} />
                    <span className="lg:text-sm lg:font-bold">내 정보 수정</span>
                  </Link>
                )}
              </div>
              <button
                type="button"
                className="w-full cursor-pointer border-gray-300 pb-5 text-right text-sm text-gray-500 hover:underline md:border-t md:pt-6 md:pb-0 md:text-left"
                onClick={() => setIsWithdrawModalOpen?.(true)}
              >
                회원탈퇴
              </button>
            </>
          )}

          {/* 다른 유저 프로필 */}
          {!isMyProfile && (
            <>
              {data?.isBlocked && (
                <div className="flex flex-col gap-3.5">
                  <div className="bg-danger-100/30 border-danger-100 text-danger-800 flex items-center justify-center gap-2 rounded-lg border p-2.5 font-medium">
                    <ShieldAlert />
                    <span>이 사용자를 차단했습니다</span>
                  </div>
                  <Button
                    icon={LockOpen}
                    onClick={() => unblockUser?.()}
                    className="bg-primary-200 flex cursor-pointer items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-white transition-all"
                  >
                    차단 해제하기
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                {data?.isReported ? (
                  <div className="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-sm text-gray-500">
                    <Flag size={16} className="text-gray-500" />
                    <span>신고완료</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-transparent px-4 pt-4 pb-3 text-sm text-gray-500 hover:bg-gray-100 md:py-1.5"
                    onClick={() => setIsReportModalOpen?.(true)}
                  >
                    <Flag size={16} />
                    신고하기
                  </button>
                )}

                {!data?.isBlocked && (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-transparent px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 md:py-1.5"
                    onClick={() => setIsBlockModalOpen?.(true)}
                  >
                    <Ban size={16} />
                    차단하기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
