import { cn } from '@/lib/utils/cn'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'bg-primary-300 flex size-8 items-center justify-center rounded-full text-white',
            currentStep === 3 && 'bg-[#22C55E]'
          )}
        >
          1
        </div>
        <div
          className={cn(
            'h-1 w-20 rounded bg-gray-300',
            currentStep >= 2 && 'bg-primary-300',
            currentStep === 3 && 'bg-[#22C55E]'
          )}
        />
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-full bg-gray-300 text-gray-500',
            currentStep >= 2 && 'bg-primary-300 text-white',
            currentStep === 3 && 'bg-[#22C55E] text-white'
          )}
        >
          2
        </div>
        <div className={cn('h-1 w-20 rounded bg-gray-300', currentStep === 3 && 'bg-[#22C55E]')} />
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-full bg-gray-300 text-gray-500',
            currentStep === 3 && 'bg-[#22C55E] text-white'
          )}
        >
          3
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex w-8 items-center justify-center">
          <p className="text-center text-sm whitespace-nowrap text-gray-500">이메일 입력</p>
        </div>
        <div className="w-20"></div>
        <div className="flex w-8 items-center justify-center">
          <p className="text-center text-sm whitespace-nowrap text-gray-500">이메일 인증</p>
        </div>
        <div className="w-20"></div>
        <div className="flex w-8 items-center justify-center">
          <p className="text-center text-sm whitespace-nowrap text-gray-500">비밀번호 재설정</p>
        </div>
      </div>
    </div>
  )
}
