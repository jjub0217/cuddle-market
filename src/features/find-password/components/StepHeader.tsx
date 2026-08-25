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
            <h2 className="text-base font-semibold">비밀번호 재설정</h2>
            <p className="text-sm text-gray-500">가입하신 이메일을 입력하면 인증코드를 보내드립니다</p>
          </>
        ) : currentStep === 2 ? (
          <>
            <h2 className="text-base font-semibold">이메일 인증</h2>
            {/* ⚠️ **「인증코드를 발송했습니다」라고 단정하지 않는다**(#849). 이제 서버는
                가입 여부를 화면에 알려주지 않아서, 여기 오는 사람 중에는 인증코드가
                아니라 **가입 방법 안내**를 받는 사람(소셜 가입)과 **아무것도 못 받는**
                사람(가입 안 함)이 섞여 있다. 셋 다에게 맞는 말을 써야 거짓말이 안 된다. */}
            <p>{`${email}로 안내 메일을 보냈습니다.`}</p>
            <p className="text-sm text-gray-500">메일이 오지 않으면 가입 방법이 다를 수 있어요.</p>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">이메일 입력</h2>
            <p className="text-sm text-gray-500">가입하신 이메일을 입력하면 인증코드를 보내드립니다</p>
          </>
        )}
      </div>
    </div>
  )
}
