'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { UnderlineTabs } from '@/components/UnderlineTabs'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'
import type { MyPageData } from '@/components/profile/ProfileData'
import { ROUTES } from '@/constants/routes'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { uploadImage } from '@/lib/api/products'
import imageCompression from 'browser-image-compression'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/store/userStore'
import InlineNotification from '@/components/commons/InlineNotification'
import { AnimatePresence } from 'framer-motion'

interface MyDashboardProps {
  profile?: MyPageData
  myProducts?: Product[]
  myRequests?: Product[]
  myFavorites?: Product[]
}

type DashboardTab = 'sales' | 'purchases' | 'wishlist'

interface TabConfig {
  label: string
  nav: string
  tab: string
}

const TAB_CONFIG: Record<DashboardTab, TabConfig> = {
  sales: { label: '판매 내역', nav: 'nav-sales', tab: 'tab-sales' },
  purchases: { label: '구매 내역', nav: 'nav-purchases', tab: 'tab-purchases' },
  wishlist: { label: '관심 목록', nav: 'nav-wishlist', tab: 'tab-wishlist' },
}

const TAB_ORDER: DashboardTab[] = ['sales', 'purchases', 'wishlist']

const DASHBOARD_TABS_LIST: { id: DashboardTab; label: string; code: DashboardTab }[] = TAB_ORDER.map((id) => ({
  id,
  label: TAB_CONFIG[id].label,
  code: id,
}))

const SUMMARY_ITEMS = [
  { key: 'sales', label: '판매 내역' },
  { key: 'purchases', label: '구매 내역' },
  { key: 'wishlist', label: '관심 목록' },
] as const

export default function MyDashboard({ profile, myProducts, myRequests, myFavorites }: MyDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales')
  const [imgError, setImgError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState(profile?.profileImageUrl || '')
  const [imageUpdateError, setImageUpdateError] = useState<React.ReactNode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const updateUserProfile = useUserStore((state) => state.updateUserProfile)

  const dataMap: Record<DashboardTab, Product[] | undefined> = {
    sales: myProducts,
    purchases: myRequests,
    wishlist: myFavorites,
  }

  const currentData = dataMap[activeTab]?.slice(0, 4) ?? []
  const currentConfig = TAB_CONFIG[activeTab]
  const summaryCounts = {
    sales: myProducts?.length ?? 0,
    purchases: myRequests?.length ?? 0,
    wishlist: myFavorites?.length ?? 0,
  }

  const compressImage = async (file: File) => {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp',
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

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
      const compressedFile = await compressImage(file)
      const uploadedUrl = await uploadImage([compressedFile])
      const nextProfileImageUrl = uploadedUrl.mainImageUrl

      const { updateProfile: response } = await fetchGraphQL<{ updateProfile: { success: boolean; code: string } }>(
        `
        mutation UpdateProfile($input: ProfileUpdateInput!) {
          updateProfile(input: $input) { success code }
        }
      `,
        { input: { profileImageUrl: nextProfileImageUrl } }
      )

      if (response.code === 'SUCCESS') {
        setProfileImageUrl(nextProfileImageUrl)
        setImgError(false)
        setImageUpdateError(null)
        updateUserProfile({ profileImageUrl: nextProfileImageUrl })
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
    <div className="flex flex-col gap-8">
      <section className="bg-surface-container-lowest border-outline-variant/50 rounded-3xl border p-6 shadow-sm">
        <AnimatePresence>
          {imageUpdateError ? (
            <InlineNotification type="error" onClose={() => setImageUpdateError(null)}>
              {imageUpdateError}
            </InlineNotification>
          ) : null}
        </AnimatePresence>
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-5 md:gap-8">
            <div className="relative h-20 w-20 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="bg-chip-surface relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#825500]">
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgError ? profileImageUrl : toResizedWebpUrl(profileImageUrl, 150)}
                    srcSet={getImageSrcSet(profileImageUrl)}
                    sizes={IMAGE_SIZES.smallThumbnail}
                    alt={profile?.nickname || '프로필 이미지'}
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
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#825500]">
                    {profile?.nickname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="bg-primary-100 absolute right-0 bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full"
                onClick={() => fileInputRef.current?.click()}
                aria-label="프로필 사진 변경"
              >
                <Camera size={20} />
              </button>
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-on-surface text-xl font-semibold">{profile?.nickname}</h2>
                <Link
                  href={ROUTES.PROFILE_UPDATE}
                  className="bg-primary-100 text-on-surface-variant hover:bg-primary-200 inline-flex w-fit items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition-colors"
                >
                  프로필 수정
                </Link>
              </div>
              <div className="flex">
                {SUMMARY_ITEMS.map((item, index) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex flex-col items-center gap-2',
                      index < SUMMARY_ITEMS.length - 1 ? 'border-outline-variant/50 border-r pr-4 md:pr-6' : ''
                    )}
                  >
                    <span className="text-on-surface-variant text-sm font-medium">{item.label}</span>
                    <strong className="text-on-surface text-3xl font-bold">{summaryCounts[item.key]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 거래 내역 요약 */}
      <section className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-6 shadow-sm md:p-8">
        <UnderlineTabs
          tabs={DASHBOARD_TABS_LIST}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as DashboardTab)}
          ariaLabel="대시보드 거래 탭"
          className="mb-6"
          rightSlot={
            <Link
              href={`?nav=${currentConfig.nav}&tab=${currentConfig.tab}`}
              className="text-primary flex items-center gap-1 text-sm font-bold hover:underline"
            >
              전체보기
              <ChevronRight size={16} />
            </Link>
          }
        />
        {currentData.length === 0 ? (
          <p className="text-on-surface-muted py-12 text-center text-sm">표시할 항목이 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentData.map((product, index) => (
              <li key={product.id}>
                <ProductCard data-index={index} data={product} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 활동 요약 */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-lg font-bold">나의 커뮤니티 글</h2>
            <Link href="?nav=nav-activity" className="text-primary text-sm font-bold hover:underline">
              전체보기
            </Link>
          </div>
          <p className="text-on-surface-muted py-8 text-center text-sm">작성한 커뮤니티 글이 없습니다.</p>
        </div>

        <div className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-lg font-bold">최근 작성한 댓글</h2>
            <Link href="?nav=nav-activity" className="text-primary text-sm font-bold hover:underline">
              전체보기
            </Link>
          </div>
          <p className="text-on-surface-muted py-8 text-center text-sm">작성한 댓글이 없습니다.</p>
        </div>
      </section>
    </div>
  )
}
