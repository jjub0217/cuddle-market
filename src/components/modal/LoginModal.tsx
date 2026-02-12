'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Button from '@/components/commons/button/Button'
import { ROUTES } from '@/constants/routes'
import { useLoginModalStore } from '@/store/modalStore'
import { useUserStore } from '@/store/userStore'
import { useEffect, useRef } from 'react'

export default function LoginModal() {
  const { isOpen, modalType, onConfirm, closeModal } = useLoginModalStore()
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  // 모달 타입에 따른 텍스트 설정
  const isLogin = modalType === 'login'
  const heading = isLogin ? '로그인이 필요합니다' : '로그아웃'
  const description = isLogin ? '로그인 하시겠습니까?' : '정말로 로그아웃 하시겠습니까?'
  const confirmText = isLogin ? '로그인' : '로그아웃'

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-11/12 open:flex flex-col items-center gap-6 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-80"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={closeModal}
    >
      <div className="flex w-full flex-col items-center gap-2">
        <h2 className="heading-h4">{heading}</h2>
        <p>{description}</p>
      </div>
      <div className="flex w-full gap-3">
        <Button size="md" className="flex-1 cursor-pointer border border-gray-300" onClick={() => dialogRef.current?.close()} type="button">
          취소
        </Button>
        {isLogin ? (
          <Link
            href={ROUTES.LOGIN}
            className="bg-primary-300 flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-white"
            onClick={() => {
              const search = searchParams.toString()
              setRedirectUrl(search ? `${pathname}?${search}` : pathname)
              dialogRef.current?.close()
            }}
          >
            {confirmText}
          </Link>
        ) : (
          <Button size="md" className="bg-primary-300 flex-1 cursor-pointer text-white" onClick={handleConfirm}>
            {confirmText}
          </Button>
        )}
      </div>
    </dialog>
  )
}
