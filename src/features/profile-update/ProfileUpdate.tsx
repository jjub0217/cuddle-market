'use client'

import ProfileData from '@/components/profile/ProfileData'
import { useEffect, useState } from 'react'
import ProfileUpdateBaseForm from './components/ProfileUpdateBaseForm'
import { useQuery } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useUserStore } from '@/store/userStore'
import ProfileUpdatePasswordForm from './components/ProfileUpdatePasswordForm'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRouter, usePathname } from 'next/navigation'
import WithdrawModal, { type WithDrawFormValues } from '@/components/modal/WithdrawModal'
import Spinner from '@/components/commons/spinner/Spinner'
import { ROUTES } from '@/constants/routes'

function ProfileUpdate() {
  const router = useRouter()
  const pathname = usePathname()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawError, setWithdrawError] = useState<React.ReactNode | null>(null)
  const { user, _hasHydrated, clearAll, updateUserProfile, setRedirectUrl } = useUserStore()

  const socialDomains = ['gmail', 'kakao']
  const isSocialLogin = socialDomains.some((domain) => user?.email?.includes(domain))

  const isMd = useMediaQuery('(min-width: 768px)')
  const {
    data: myData,
    isLoading: isLoadingMyData,
    error,
  } = useQuery({
    queryKey: ['mypage', user?.id],
    queryFn: async () => {
      const data = await fetchGraphQL<{ myProfile: any }>(`
        query MyProfile {
          myProfile { id email name nickname birthDate profileImageUrl introduction addressSido addressGugun createdAt rating }
        }
      `)
      return data.myProfile
    },
    enabled: !!user,
  })

  const handleWithdraw = async (data: WithDrawFormValues) => {
    try {
      await fetchGraphQL(`
        mutation Withdraw($reason: String!, $detailReason: String!) {
          withdraw(reason: $reason, detailReason: $detailReason) { success }
        }
      `, { reason: data.reason, detailReason: data.detailReason })
      clearAll()
      router.push(ROUTES.HOME)
    } catch {
      setWithdrawError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">회원탈퇴에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  useEffect(() => {
    if (myData) {
      updateUserProfile({
        profileImageUrl: myData.profileImageUrl,
        nickname: myData.nickname,
        name: myData.name,
        introduction: myData.introduction,
        birthDate: myData.birthDate,
        email: myData.email,
        addressSido: myData.addressSido,
        addressGugun: myData.addressGugun,
        createdAt: myData.createdAt,
      })
    }
  }, [myData, updateUserProfile])

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (_hasHydrated && !user?.id) {
      setRedirectUrl(pathname)
      router.push(ROUTES.LOGIN)
    }
  }, [_hasHydrated, user, router, setRedirectUrl, pathname])

  if (isLoadingMyData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (error || !myData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>프로필 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push(ROUTES.MYPAGE)} className="text-blue-600 hover:text-blue-800">
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pb-4xl bg-[#F3F4F6] pt-0 md:pt-8">
        <h1 className="sr-only">프로필 수정</h1>
        <div className="mx-auto flex max-w-7xl flex-col gap-0 md:flex-row md:gap-8 md:p-0">
          {isMd ? <ProfileData setIsWithdrawModalOpen={setIsWithdrawModalOpen} data={myData!} isMyProfile /> : null}
          <div className="flex w-full flex-col gap-8 p-5 md:p-0">
            <ProfileUpdateBaseForm myData={myData!} />
            {!isSocialLogin ? <ProfileUpdatePasswordForm /> : null}
          </div>
        </div>
      </div>
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onConfirm={handleWithdraw}
        onCancel={() => setIsWithdrawModalOpen(false)}
        error={withdrawError}
        onClearError={() => setWithdrawError(null)}
      />
    </>
  )
}

export default ProfileUpdate
