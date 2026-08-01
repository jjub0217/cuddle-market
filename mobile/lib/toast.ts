import { create } from 'zustand';

// 잠깐 떴다 사라지는 알림.
//
// 왜 웹 toastStore를 안 가져오나:
// 웹 것(src/store/toastStore.ts)은 큐가 있다 — 최대 5개까지 띄우고 넘치면 대기시켰다가
// 하나 빠지면 채운다. 그리고 id를 crypto.randomUUID()로 만드는데 그건 브라우저 것이라
// React Native에 없다.
//
// 지금 앱에서 토스트를 띄우는 곳은 신고·차단 둘뿐이라 큐가 남아돈다. 웹 store를
// 건드리면 웹 토스트 전체가 회귀 시험 대상이 되기도 한다.
// 토스트 쓸 곳이 느는 바퀴(11 상품등록 · 12 채팅)에 규칙을 @cuddle/shared로 올려
// 웹과 나눠 쓰는 게 순서다.
//
// 그래서 여기는 **한 번에 하나만** 띄운다. 새 것이 오면 앞엣것을 밀어낸다.

/** 웹 TOAST_DEFAULTS.durationMs와 같은 값. */
export const TOAST_DURATION_MS = 3000;

interface ToastState {
  message: string | null;
  /**
   * 같은 문구를 연달아 띄울 때도 다시 보이게 하는 값.
   * message만 보면 값이 안 바뀌어 화면이 반응하지 않는다.
   */
  seq: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  seq: 0,
  show: (message) => set((state) => ({ message, seq: state.seq + 1 })),
  hide: () => set({ message: null }),
}));

/** 화면 밖(이벤트 처리 함수 안)에서도 부를 수 있게 훅이 아닌 함수로 둔다. */
export function showToast(message: string) {
  useToastStore.getState().show(message);
}
