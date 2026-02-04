import { create } from 'zustand'

// ===== 확인 모달 상태 타입 =====
interface ConfirmModalState {
  // 모달 열림/닫힘 상태
  isOpen: boolean

  // 모달 타입: 'login' (로그인 유도) 또는 'logout' (로그아웃 확인)
  modalType: 'login' | 'logout'

  // 로그아웃 시 실행할 콜백 함수
  onConfirm: (() => void) | null

  // 로그인 모달 열기
  // 사용: openLoginModal()
  // 결과: 로그인 유도 모달이 화면에 표시됨
  openLoginModal: () => void

  // 로그아웃 확인 모달 열기
  // 사용: openLogoutModal(onLogout)
  // 결과: 로그아웃 확인 모달이 화면에 표시되고, 확인 시 onLogout 실행
  openLogoutModal: (onConfirm: () => void) => void

  // 모달 닫기
  // 사용: closeModal()
  // 결과: 모달이 화면에서 사라짐
  closeModal: () => void
}

// ===== 확인 모달 스토어 =====
// 로그인 유도, 로그아웃 확인 등 다양한 확인 모달에 사용
// 어떤 페이지에서든 openLoginModal() 또는 openLogoutModal()을 호출하면 모달이 열림
export const useLoginModalStore = create<ConfirmModalState>((set) => ({
  // 초기 상태
  isOpen: false,
  modalType: 'login',
  onConfirm: null,

  // 로그인 모달 열기 액션
  openLoginModal: () =>
    set({
      isOpen: true,
      modalType: 'login',
      onConfirm: null,
    }),

  // 로그아웃 모달 열기 액션
  // onConfirm: 확인 버튼 클릭 시 실행할 함수 (예: 로그아웃 API 호출)
  openLogoutModal: (onConfirm) =>
    set({
      isOpen: true,
      modalType: 'logout',
      onConfirm,
    }),

  // 모달 닫기 액션
  closeModal: () =>
    set({
      isOpen: false,
      onConfirm: null,
    }),
}))
