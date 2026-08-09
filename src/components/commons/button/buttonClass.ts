import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva('flex items-center justify-center rounded-lg font-medium transition-colors', {
  variants: {
    variant: {
      default: '',
      ghost: 'bg-transparent hover:bg-gray-100',
      link: 'bg-transparent p-0 hover:underline',
      // 앱과 같은 브랜드 갈색이다(mobile/constants/colors.ts 의 action = #825500).
      // 앱이 #786 에서 실기기로 보며 정한 값이라 그쪽으로 모았다.
      // 전에는 bg-primary(#633F00)라 앱보다 한 단계 진했다 — 두 화면을 나란히 놓으면 달라 보였다(#847).
      primary:
        'bg-primary-600 shadow-primary/20 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl',
      secondary:
        'border border-outline-variant/60 text-on-surface hover:bg-surface-container-high transition-all',
    },
    size: {
      // 높이를 h-* 로 못 박는다. padding + 줄높이로 정하면 글자 크기를 바꿀 때마다
      // 높이가 따라 흔들려, 나란히 놓인 칸과 단추의 줄이 안 맞는다(#847).
      //
      // 폭에 따라 바꾸지 않는다. 한때 모바일을 48 로 키워 봤는데(손가락 권장치)
      // **입력칸(40)보다 단추가 커서 어색했다** — 실기기로 보고 되돌렸다.
      // md 40 이 입력칸(Input.tsx 의 h-10)과 같은 값이다.
      //
      // 글자는 **셋 다 14(text-sm)로 같다.** 크기 단계가 정하는 것은 높이와 좌우 여백뿐이다.
      // 전에는 md·lg 가 16 이라, 같은 자리의 단추인데 화면마다 글자가 갈렸다 —
      // 로그인·회원가입은 16 인데 비밀번호 찾기는 14 였다(#847 실측).
      // 앱은 주 단추도 창 안 단추도 15 로 하나다(mobile 의 login-form · delete-confirm-modal).
      // 웹에는 15 가 없으니(text-sm 14 · text-base 16) 앱에 가까운 14 로 모은다.
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-sm',
    },
    iconPosition: {
      none: '',
      left: 'gap-2.5',
      only: '',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
  },
  // 아이콘만 있는 단추는 가로세로가 같아야 동그라미·네모가 안 찌그러진다.
  // 위 size 의 높이와 같은 값을 쓴다.
  compoundVariants: [
    {
      size: 'sm',
      iconPosition: 'only',
      className: 'h-9 w-9 p-0',
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-10 w-10 p-0',
    },
    {
      size: 'lg',
      iconPosition: 'only',
      className: 'h-12 w-12 p-0',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
    iconPosition: 'none',
  },
})

export const iconSizeMap = {
  xs: 16,
  sm: 16,
  md: 20,
  lg: 24,
} as const

export type ButtonVariants = VariantProps<typeof buttonVariants>
