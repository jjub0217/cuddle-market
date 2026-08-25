'use client'

import Link from 'next/link'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'

import RequiredLabel from '@/components/commons/RequiredLabel'
import { ROUTES } from '@/constants/routes'

// 가입할 때 받는 필수 동의 둘(#1088).
//
// 왜 받나: 약관규제법 제3조가 **계약을 맺을 때 약관을 밝히고** 중요한 내용을 설명하라고
// 정한다. 회원가입이 곧 이용계약 체결이다. #803 으로 /terms 가 생겼으니 동의가 이어져야
// 짝이 맞는다 — 약관은 있는데 아무도 동의한 적이 없으면 반쪽이다.
//
// 왜 이 조각으로 뺐나: 일반 가입(SignUpForm)과 소셜 가입(SocialSignUpForm) 두 곳이
// 같은 문구·같은 링크를 써야 한다. 각자 적어 두면 한쪽만 고쳐져 갈라진다.
//
// 체크박스 생김새는 **WithdrawModal.tsx 를 그대로 본떴다** — 이 저장소에서
// `type="checkbox"` 를 쓰는 유일한 자리이고, `input#id` + `RequiredLabel htmlFor` 로
// 라벨과 입력을 잇는 결이 거기서 왔다. 새로 짓지 않았다.

export interface ConsentFormValues {
  agreeTerms: boolean
  agreePrivacy: boolean
}

const CONSENTS = [
  {
    name: 'agreeTerms',
    label: '이용약관에 동의합니다.',
    href: ROUTES.TERMS,
    // ⚠️ 링크 글자가 둘 다 「보기」라 화면낭독기에는 어디로 가는지 안 들린다.
    //    무엇을 보는 링크인지 aria-label 로 따로 일러 준다.
    linkLabel: '이용약관 보기',
  },
  {
    name: 'agreePrivacy',
    label: '개인정보처리방침에 동의합니다.',
    href: ROUTES.PRIVACY,
    linkLabel: '개인정보처리방침 보기',
  },
] as const

interface ConsentFieldsProps<T extends FieldValues> {
  register: UseFormRegister<T>
}

export function ConsentFields<T extends FieldValues & ConsentFormValues>({
  register,
}: ConsentFieldsProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      {CONSENTS.map((consent) => (
        <div key={consent.name} className="flex items-center gap-3">
          <input
            id={consent.name}
            type="checkbox"
            className="h-4 w-4"
            // ⚠️ `required` 는 보기 좋으라고 붙인 것이 아니다. 이것이 있어야
            //    react-hook-form 의 handleSubmit 이 **onSubmit 자체를 안 부른다** —
            //    단추를 꺼 두는 것만으로는 엔터키·프로그램 호출을 못 막는다.
            {...register(consent.name as Path<T>, { required: true })}
          />
          <RequiredLabel htmlFor={consent.name} labelClass="text-sm">
            {consent.label}
          </RequiredLabel>
          {/* 새 창으로 연다. 같은 창에서 열면 지금까지 적은 가입 정보가 날아간다. */}
          <Link
            href={consent.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={consent.linkLabel}
            className="ml-auto shrink-0 text-sm text-gray-500 underline hover:text-gray-900"
          >
            보기
          </Link>
        </div>
      ))}
    </div>
  )
}
