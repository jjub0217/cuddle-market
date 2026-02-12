import { LockKeyholeOpen, KeyRound, MailCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StepHeaderProps {
  currentStep: 1 | 2 | 3
  email: string
}

export function StepHeader({ currentStep, email }: StepHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn('bg-primary-50 flex size-16 items-center justify-center rounded-full', currentStep === 3 && 'bg-[#DCFCE7]')}
      >
        {currentStep === 3 ? (
          <KeyRound size={24} className="text-[#22C55E]" />
        ) : currentStep === 2 ? (
          <MailCheck size={24} className="text-primary-400" />
        ) : (
          <LockKeyholeOpen size={24} className="text-primary-400" />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        {currentStep === 3 ? (
          <>
            <h2 className="heading-h5">비밀번호 재설정</h2>
            <p>가입하신 이메일을 입력하면 인증코드를 보내드립니다</p>
          </>
        ) : currentStep === 2 ? (
          <>
            <h2 className="heading-h5">이메일 인증</h2>
            <p>{`${email}로 인증코드를 발송했습니다.`}</p>
          </>
        ) : (
          <>
            <h2 className="heading-h5">이메일 입력</h2>
            <p>가입하신 이메일을 입력하면 인증코드를 보내드립니다</p>
          </>
        )}
      </div>
    </div>
  )
}
