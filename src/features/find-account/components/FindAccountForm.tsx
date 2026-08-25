'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { isAxiosError } from 'axios'
import Button from '@/components/commons/button/Button'
import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import { ROUTES } from '@/constants/routes'
import { findAccount } from '@/lib/api/auth'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'

interface FindAccountFormValues {
  email: string
}

/**
 * 제출한 뒤 보여주는 **단 하나의 문구**.
 *
 * ⚠️ 이 화면은 「이 이메일이 회원인가」를 **절대 말하지 않는다.** 말하는 순간
 *    남의 이메일을 넣어 보는 것만으로 누가 이 서비스에 가입했는지 알아낼 수 있다
 *    (계정 열거, #849). 그래서 가입이든 미가입이든, 이메일 가입이든 소셜이든
 *    **같은 글자**가 나온다.
 *
 * 진짜 안내(「카카오로 가입되어 있어요」)는 **메일로** 간다. 메일함을 여는 사람은
 * 그 주소의 주인뿐이라 거기서는 알려 줘도 된다.
 */
// ⚠️ **두 줄이 더 붙은 까닭**(#1091)
//
//   「스팸함도」        메일이 안 왔다고 느끼는 가장 흔한 진짜 원인이다
//   「잠시 동안 다시…」  서버가 같은 안내를 10분에 한 번만 보낸다. 그것을 미리 알려
//                      다시 눌러 놓고 오지 않는 메일을 기다리는 일을 줄인다
//
// ⚠️ **이 문장은 넣은 이메일이 무엇이든 늘 똑같이 나온다.** 가입 여부에 따라 갈리는
//    것이 하나도 없다 — 갈리는 순간 계정 열거가 다시 뚫린다(#849).
const SENT_MESSAGE = '가입된 계정이 있다면 안내 메일을 보냈습니다.\n메일함(스팸함도)을 확인해주세요.\n같은 안내는 잠시 동안 다시 보내지 않아요.'

/**
 * 서버에 닿지도 못했을 때의 문구.
 *
 * ⚠️ 이것만 다른 말을 한다. 그래도 새지 않는 까닭: **넣은 이메일과 아무 상관이 없다.**
 *    비행기 모드에서는 어떤 이메일을 넣어도 이 문구가 나온다. 열거는 「이메일에 따라
 *    화면이 갈리는 것」이지 「화면이 두 종류인 것」이 아니다.
 */
const NETWORK_MESSAGE = '지금은 연결이 되지 않아요. 잠시 후 다시 시도해주세요.'

export function FindAccountForm() {
  /**
   * 화면이 가질 수 있는 상태는 **셋뿐이고, 그중 둘만 이메일과 관련이 없다.**
   *
   *   idle      아직 안 눌렀다
   *   sent      **서버가 무엇을 답했든** 여기로 온다
   *   offline   서버에 닿지도 못했다
   *
   * 서버 응답을 담는 자리가 아예 없다는 점이 중요하다. 담을 곳이 없으면 실수로
   * 화면에 뿌릴 수도 없다 — 비밀번호 찾기는 담아 두었다가 그대로 뿌린다
   * (FindPasswordForm.tsx 의 sendValidCodeResult.message).
   */
  const [status, setStatus] = useState<'idle' | 'sent' | 'offline'>('idle')
  const [submitting, setSubmitting] = useState(false)

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = useForm<FindAccountFormValues>({ defaultValues: { email: '' } })
  const email = useWatch({ control, name: 'email' })

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      await findAccount(email)
      setStatus('sent')
    } catch (error) {
      // ⚠️ **서버가 뭐라고 답했는지 보지 않는다.** 상태 코드도, 문구도 안 본다.
      //    보는 것은 「답이 오기는 했는가」 하나뿐이다.
      //
      //    왜 404 를 따로 다루지 않나 — 프론트는 「엔드포인트가 없어서 404」와
      //    「그런 계정이 없어서 404」를 **구분할 방법이 없다.** 구분하려 드는 순간
      //    그 구분이 곧 열거 통로가 된다. 그래서 서버가 답을 준 것은 전부 'sent' 다.
      //
      //    axios 는 서버가 답을 줬으면 error.response 를 채우고, 아예 못 닿았으면
      //    (DNS·타임아웃·오프라인) 비워 둔다. 그 하나만 본다.
      if (isAxiosError(error) && error.response) {
        setStatus('sent')
      } else {
        setStatus('offline')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="w-full rounded-[20px] bg-white px-10 py-10" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">계정 찾기</legend>

        <div className="flex flex-col gap-1">
          <RequiredLabel required={false} labelClass="font-medium text-sm">
            이메일
          </RequiredLabel>
          <InputField
            type="email"
            placeholder="이메일 (example@cuddle.com)"
            backgroundColor="bg-white"
            border
            error={errors.email}
            registration={register('email', authValidationRules.email)}
          />
        </div>

        {/* 결과 박스. 비밀번호 찾기의 「막다른 길」 박스와 같은 모양이다 —
            거기서도 「여기 말고 저쪽으로 가세요」를 이 모양으로 말한다. */}
        {status === 'idle' ? (
          <>
            <Button
              size="md"
              className="bg-primary-600 w-full cursor-pointer text-sm text-white"
              type="submit"
              disabled={submitting}
            >
              {submitting ? '보내는 중...' : '안내 메일 받기'}
            </Button>
            <Link href={ROUTES.LOGIN} className="text-primary w-full text-center text-sm font-medium">
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <div className="bg-surface-container-low flex flex-col gap-3 rounded-lg p-4">
            <p className="text-sm whitespace-pre-line text-gray-700">
              {status === 'sent' ? SENT_MESSAGE : NETWORK_MESSAGE}
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="bg-primary-600 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              로그인하러 가기
            </Link>
          </div>
        )}
      </fieldset>
    </form>
  )
}
