// 회원가입 입력 검증. 화면을 모르는 순수 함수라 테스트가 쉽다.
//
// 규칙 값은 전부 웹에서 가져왔다 — 앱이 새로 정하면 웹 가입자와 앱 가입자의
// 계정 규격이 갈린다.
//   이메일·비밀번호  src/lib/utils/validation/authValidationRules.ts
//   이름·닉네임      src/features/signup/validationRules.ts
//   만 14세          백엔드 AuthServiceImpl.validateAge

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 대문자·소문자·숫자·특수문자를 각각 하나씩은 갖춰야 한다. 웹과 같은 정규식이다.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/;

const MIN_AGE = 14;

export function validateEmail(value: string): string | null {
  if (value.trim().length === 0) return '이메일을 입력해주세요';
  if (!EMAIL_PATTERN.test(value.trim())) return '이메일 형식이 올바르지 않습니다';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return '비밀번호를 입력해주세요';
  if (value.length < 10) return '비밀번호는 최소 10자 이상이어야 합니다';
  if (value.length > 30) return '비밀번호는 최대 30자까지 가능합니다';
  if (!PASSWORD_PATTERN.test(value)) {
    return '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다';
  }
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (confirm.length === 0) return '비밀번호 확인을 입력해주세요';
  if (password !== confirm) return '비밀번호가 일치하지 않습니다';
  return null;
}

/** 이름과 닉네임은 규칙이 같아 한 함수로 만들고 문구만 바꿔 쓴다. */
function validateLength2to10(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return `${label}을 입력해주세요`;
  if (trimmed.length < 2 || trimmed.length > 10) {
    return `${label}은 2~10자 이하이어야 합니다.`;
  }
  return null;
}

export function validateName(value: string): string | null {
  return validateLength2to10(value, '이름');
}

export function validateNickname(value: string): string | null {
  return validateLength2to10(value, '닉네임');
}

/** 세 칸을 0으로 채워 붙인다. 서버는 YYYY-MM-DD만 받는다. */
export function formatBirthDate(year: string, month: string, day: string): string {
  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function validateBirthDate(year: string, month: string, day: string): string | null {
  if (!year || !month || !day) return '생년월일을 입력해주세요';

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return '생년월일을 확인해주세요';
  }

  // new Date(2012, 1, 31)은 3월 2일로 넘어가 버린다. 되돌려 비교해야 "없는 날짜"를 잡는다.
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return '생년월일을 확인해주세요';
  }

  const today = new Date();
  // 만 나이: 생일이 아직 안 지났으면 한 살 뺀다.
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d);
  if (beforeBirthday) age -= 1;

  if (age < MIN_AGE) return `만 ${MIN_AGE}세 이상만 가입할 수 있습니다`;
  return null;
}
