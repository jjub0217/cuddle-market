import { useCallback, useEffect, useRef, useState } from 'react';

import {
  passwordRules,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../signup/validation';
import {
  PasswordResetRejectedError,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from './api';

// 비밀번호 찾기의 값·단계·타이머를 전부 여기서 들고 있는다.
// 화면(app/find-password.tsx)은 이걸 어떻게 배치할지만 정한다 — 가입 화면과 같은 구조다.
//
// ⚠️ 단계를 미는 것은 **성공했을 때뿐이다.** 웹이 이걸 어겨서 버그가 났다(#836):
//    「시도했음」으로 단계를 넘겨서, 서버가 거절한 이메일에도 인증코드 칸이 떴다.
//
// 검증 규칙은 가입 화면 것을 그대로 쓴다(../signup/validation). 앱이 새로 정하면
// 가입 때 통과한 비밀번호가 재설정 때 막히는 일이 생긴다.

/** 서버 만료가 5분이라 그대로 맞춘다(EmailVerificationServiceImpl). */
const CODE_TTL_SECONDS = 300;

type FieldKey = 'email' | 'code' | 'password' | 'passwordConfirm';

const EMPTY_VALUES: Record<FieldKey, string> = {
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
};

export function useFindPassword() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // 막다른 길 안내. 「고쳐서 다시 하세요」(칸 아래 빨간 오류)와 달리
  // 「여기 말고 저쪽으로 가세요」라서 화면이 다른 모양(박스)으로 그린다.
  const [blocked, setBlocked] = useState<'kakao' | 'google' | 'social' | 'notFound' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 화면이 사라진 뒤 setState 가 불리지 않게 정리한다.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(CODE_TTL_SECONDS - 1); // 화면에 4:59부터 보이게 한다
    tickRef.current = setInterval(() => {
      // 여기서는 **숫자만 줄인다.** 0에 닿았을 때 할 일은 아래 useEffect 가 맡는다.
      //
      // ⚠️ 상태 갱신 함수 안에서 다른 상태를 바꾸면 안 된다. 그 자리는 React 가
      //    여러 번 불러 볼 수 있는 순수한 자리라, 부작용을 넣으면 조용히 안 먹는다.
      //    (가짜 타이머로 5분을 감았는데 단계가 안 돌아와서 잡았다)
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, [stopTimer]);

  // 코드가 만료되면 1단계로 돌린다. 만료된 코드를 계속 넣게 두면 헷갈린다.
  //
  // step 이 2 로 바뀌는 순간 secondsLeft 도 299 로 함께 세워지므로(sendCode),
  // 「2단계인데 0」은 다 써서 만료됐다는 뜻뿐이다.
  //
  // 덤으로 안전망이 된다 — 어딘가에서 타이머 없이 2단계로 잘못 넘어가도 여기서 되돌린다.
  // (마커 검증 때 catch 안에 setStep(2)를 심었는데 이 효과가 곧바로 되돌려 놔서 시험이
  //  안 잡혔다. 타이머까지 함께 켜서 심으니 그제야 잡혔다.)
  useEffect(() => {
    if (step !== 2 || secondsLeft !== 0) return;
    stopTimer();
    setStep(1);
    setValues((v) => ({ ...v, code: '' }));
  }, [step, secondsLeft, stopTimer]);

  const setValue = useCallback((key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
    // 이메일을 고치면 그 이메일에 대한 판단(막다른 길 안내)도 무효가 된다.
    if (key === 'email') setBlocked(null);
  }, []);

  const sendCode = useCallback(async () => {
    const emailError = validateEmail(values.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    const email = values.email.trim();
    setSending(true);
    setBlocked(null);
    try {
      await sendResetCode(email);
      setStep(2);
      setValues((v) => ({ ...v, code: '' }));
      setErrors((prev) => ({ ...prev, code: undefined }));
      startTimer();
    } catch (error) {
      // ⚠️ 여기서 단계를 되돌리지 않는다. 2단계의 「다시 받기」가 실패한 경우까지
      //    1단계로 밀려나면 사용자가 넣고 있던 코드를 잃는다.
      if (error instanceof PasswordResetRejectedError) {
        // 서버 문구를 칸 아래에 **또** 띄우지 않는다. 박스가 안내와 갈 길을 다 맡는다 —
        // 둘 다 두면 같은 말이 두 줄로 겹친다(웹이 그랬다).
        setBlocked(error.reason === 'unknown' ? 'notFound' : error.reason);
      } else {
        setErrors((prev) => ({
          ...prev,
          email: '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.',
        }));
      }
    } finally {
      setSending(false);
    }
  }, [values.email, startTimer]);

  const submitCode = useCallback(async () => {
    if (values.code.trim().length === 0) {
      setErrors((prev) => ({ ...prev, code: '전송된 코드를 입력해주세요' }));
      return;
    }

    setVerifying(true);
    try {
      const ok = await verifyResetCode(values.email.trim(), values.code.trim());
      if (!ok) {
        setErrors((prev) => ({ ...prev, code: '인증코드가 맞지 않아요. 다시 확인해주세요.' }));
        return;
      }
      stopTimer();
      setStep(3);
    } catch {
      setErrors((prev) => ({
        ...prev,
        code: '인증코드 확인에 실패했어요. 잠시 후 다시 시도해주세요.',
      }));
    } finally {
      setVerifying(false);
    }
  }, [values.code, values.email, stopTimer]);

  const submitNewPassword = useCallback(async (): Promise<boolean> => {
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
      return false;
    }
    const confirmError = validatePasswordConfirm(values.password, values.passwordConfirm);
    if (confirmError) {
      setErrors((prev) => ({ ...prev, passwordConfirm: confirmError }));
      return false;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        email: values.email.trim(),
        newPassword: values.password,
        confirmPassword: values.passwordConfirm,
      });
      return true;
    } catch (error) {
      setFormError(
        error instanceof PasswordResetRejectedError
          ? error.message
          : '비밀번호 변경에 실패했어요. 잠시 후 다시 시도해주세요.'
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [values.email, values.password, values.passwordConfirm]);

  const goPreviousStep = useCallback(() => {
    setErrors({});
    setFormError(null);
    setStep((prev) => {
      if (prev === 3) return 2;
      // 1단계로 돌아갈 때만 타이머를 끄고 코드를 지운다.
      // 3→2는 이미 받은 코드로 다시 확인하는 자리라 남겨 둔다.
      stopTimer();
      setSecondsLeft(0);
      setValues((v) => ({ ...v, code: '' }));
      return 1;
    });
  }, [stopTimer]);

  return {
    step,
    values,
    errors,
    formError,
    blocked,
    secondsLeft,
    sending,
    verifying,
    submitting,
    passwordChecks: passwordRules(values.password),
    setValue,
    sendCode,
    submitCode,
    submitNewPassword,
    goPreviousStep,
  };
}
