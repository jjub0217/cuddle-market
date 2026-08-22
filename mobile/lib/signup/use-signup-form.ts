import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { login } from '../auth/session';
import {
  SignUpRejectedError,
  checkEmailAvailable,
  checkNicknameAvailable,
  sendVerificationCode,
  signUp,
  verifyCode,
} from './api';
import {
  formatBirthDate,
  passwordRules,
  validateBirthDate,
  validateEmail,
  validateName,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from './validation';

// 회원가입 폼의 값·오류·서버 호출을 전부 여기서 들고 있는다.
// 화면(app/signup.tsx · app/signup-b.tsx)은 이걸 어떻게 배치할지만 정한다.
// 그래서 A안(한 화면)과 B안(2단계)이 로직을 통째로 공유한다.

/** 서버 만료가 5분이라 그대로 맞춘다(EmailVerificationServiceImpl). */
const CODE_TTL_SECONDS = 300;

export type VerificationPhase = 'idle' | 'sent' | 'verified';

const EMPTY_VALUES = {
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  addressSido: '',
  addressGugun: '',
};

export type SignupValues = typeof EMPTY_VALUES;
type Errors = Partial<Record<keyof SignupValues, string>>;

export function useSignupForm() {
  const [values, setValues] = useState<SignupValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [verification, setVerification] = useState<VerificationPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 인증코드를 보내는 동안. 중복확인 + 발송 두 번을 타서 몇 초 걸린다 —
  // 아무 표시가 없으면 앱이 멈춘 것처럼 보인다(2026-08-04 실기기).
  const [sendingCode, setSendingCode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 화면이 사라진 뒤 setState가 불리지 않게 정리한다.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const setValue = useCallback((key: keyof SignupValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);

    // 닉네임을 고치면 확인이 무효가 된다. 안 그러면 확인한 적 없는 닉네임으로 가입한다.
    if (key === 'nickname') setNicknameChecked(false);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(CODE_TTL_SECONDS - 1); // 화면에 4:59부터 보이게 한다
    tickRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          // 코드가 만료되면 처음 상태로 돌린다. 만료된 코드를 계속 넣게 두면 헷갈린다.
          setVerification('idle');
          setValues((v) => ({ ...v, code: '' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const sendCode = useCallback(async () => {
    // 인증이 끝난 뒤 재발송하면 서버가 기존 인증 기록을 지워 가입이 막힌다.
    if (verification === 'verified') return;

    const emailError = validateEmail(values.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    const email = values.email.trim();
    setSendingCode(true);
    try {
      const available = await checkEmailAvailable(email);
      if (!available) {
        setErrors((prev) => ({
          ...prev,
          email: '이미 가입된 이메일이에요. 로그인하시거나 다른 이메일을 사용해주세요.',
        }));
        return;
      }
      await sendVerificationCode(email);
      setVerification('sent');
      startTimer();
    } catch {
      setErrors((prev) => ({
        ...prev,
        email: '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.',
      }));
    } finally {
      setSendingCode(false);
    }
  }, [values.email, verification, startTimer]);

  const submitCode = useCallback(async () => {
    if (verification !== 'sent') return;
    if (values.code.trim().length === 0) {
      setErrors((prev) => ({ ...prev, code: '전송된 코드를 입력해주세요' }));
      return;
    }

    try {
      const ok = await verifyCode(values.email.trim(), values.code.trim());
      if (!ok) {
        setErrors((prev) => ({
          ...prev,
          code: '인증코드가 올바르지 않아요. 다시 확인해주세요.',
        }));
        return;
      }
      stopTimer();
      setVerification('verified');
    } catch {
      setErrors((prev) => ({ ...prev, code: '인증에 실패했어요. 잠시 후 다시 시도해주세요.' }));
    }
  }, [values.code, values.email, verification, stopTimer]);

  const changeEmail = useCallback(() => {
    stopTimer();
    setVerification('idle');
    setSecondsLeft(0);
    setValues((prev) => ({ ...prev, code: '' }));
    setErrors((prev) => ({ ...prev, email: undefined, code: undefined }));
  }, [stopTimer]);

  const checkNickname = useCallback(async () => {
    const error = validateNickname(values.nickname);
    if (error) {
      setErrors((prev) => ({ ...prev, nickname: error }));
      return;
    }

    try {
      const available = await checkNicknameAvailable(values.nickname.trim());
      if (!available) {
        setErrors((prev) => ({ ...prev, nickname: '이미 사용 중인 닉네임이에요.' }));
        setNicknameChecked(false);
        return;
      }
      setNicknameChecked(true);
    } catch {
      setErrors((prev) => ({ ...prev, nickname: '닉네임 확인에 실패했어요.' }));
    }
  }, [values.nickname]);

  // 비밀번호는 조건마다 통과 여부를 따로 보여준다. 하나씩 켜지는 게 보여야
  // "무엇이 모자란지"를 짐작하지 않아도 된다.
  const passwordChecks = useMemo(() => passwordRules(values.password), [values.password]);

  // 비밀번호 확인은 입력이 시작된 뒤부터 판단한다. 비어 있을 때 "일치하지 않음"을
  // 띄우면 아직 치지도 않았는데 혼내는 꼴이 된다.
  const passwordConfirmState: 'idle' | 'match' | 'mismatch' = useMemo(() => {
    if (values.passwordConfirm.length === 0) return 'idle';
    return values.password === values.passwordConfirm ? 'match' : 'mismatch';
  }, [values.password, values.passwordConfirm]);

  const canGoNext = useMemo(
    () =>
      verification === 'verified' &&
      validatePassword(values.password) === null &&
      validatePasswordConfirm(values.password, values.passwordConfirm) === null,
    [verification, values.password, values.passwordConfirm]
  );

  const canSubmit = useMemo(
    () =>
      canGoNext &&
      nicknameChecked &&
      validateName(values.name) === null &&
      validateNickname(values.nickname) === null &&
      validateBirthDate(values.birthYear, values.birthMonth, values.birthDay) === null &&
      values.addressSido.length > 0 &&
      values.addressGugun.length > 0,
    [canGoNext, nicknameChecked, values]
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (submitting) return false;

    // 버튼이 꺼져 있어도 한 번 더 본다. 어느 칸이 문제인지 화면에 표시해야 한다.
    const nextErrors: Errors = {
      name: validateName(values.name) ?? undefined,
      nickname: validateNickname(values.nickname) ?? undefined,
      password: validatePassword(values.password) ?? undefined,
      passwordConfirm:
        validatePasswordConfirm(values.password, values.passwordConfirm) ?? undefined,
      birthYear:
        validateBirthDate(values.birthYear, values.birthMonth, values.birthDay) ?? undefined,
      addressSido:
        values.addressSido && values.addressGugun ? undefined : '거주지를 선택해주세요',
    };
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.values(nextErrors).some(Boolean)) return false;

    if (verification !== 'verified') {
      setFormError('이메일 인증을 완료해주세요.');
      return false;
    }
    if (!nicknameChecked) {
      setErrors((prev) => ({ ...prev, nickname: '닉네임 중복체크를 완료해주세요.' }));
      return false;
    }

    setSubmitting(true);
    setFormError(null);
    const email = values.email.trim();

    try {
      await signUp({
        email,
        password: values.password,
        name: values.name.trim(),
        nickname: values.nickname.trim(),
        birthDate: formatBirthDate(values.birthYear, values.birthMonth, values.birthDay),
        addressSido: values.addressSido,
        addressGugun: values.addressGugun,
      });

      // 웹과 같이 가입 직후 로그인해 세션을 만든다(`SignUpForm.tsx` 의 `onSubmit`).
      await login(email, values.password);
      return true;
    } catch (err) {
      if (err instanceof SignUpRejectedError) {
        setFormError(err.message);
      } else if (err instanceof TypeError) {
        setFormError('인터넷 연결을 확인해주세요.');
      } else {
        setFormError('회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, values, verification, nicknameChecked]);

  return {
    values,
    setValue,
    errors,
    verification,
    secondsLeft,
    passwordChecks,
    passwordConfirmState,
    sendCode,
    sendingCode,
    submitCode,
    changeEmail,
    nicknameChecked,
    checkNickname,
    canSubmit,
    canGoNext,
    submitting,
    formError,
    submit,
  };
}
