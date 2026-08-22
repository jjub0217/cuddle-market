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

describe('validateEmail', () => {
  it('형식이 맞으면 null', () => {
    expect(validateEmail('me@cuddle.com')).toBeNull();
  });
  it('@가 없으면 문구를 돌려준다', () => {
    expect(validateEmail('mecuddle.com')).toBe('이메일 형식이 올바르지 않습니다');
  });
  it('비어 있으면 문구를 돌려준다', () => {
    expect(validateEmail('')).toBe('이메일을 입력해주세요');
  });
});

describe('validatePassword', () => {
  it('네 종류를 다 갖추고 10자 이상이면 null', () => {
    expect(validatePassword('Abcdef1!xy')).toBeNull();
  });
  it('9자면 길이 문구', () => {
    expect(validatePassword('Abcde1!xy')).toBe('비밀번호는 최소 10자 이상이어야 합니다');
  });
  it('31자면 길이 문구', () => {
    expect(validatePassword('Abcdef1!' + 'x'.repeat(23))).toBe(
      '비밀번호는 최대 30자까지 가능합니다'
    );
  });
  it('특수문자가 없으면 구성 문구', () => {
    expect(validatePassword('Abcdefg1xy')).toBe(
      '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다'
    );
  });
});

describe('passwordRules', () => {
  it('둘 다 만족하면 둘 다 true', () => {
    expect(passwordRules('Abcdef1!xy')).toEqual({ length: true, composition: true });
  });
  it('9자면 길이만 false', () => {
    expect(passwordRules('Abcde1!xy')).toEqual({ length: false, composition: true });
  });
  it('31자면 길이가 false — 최대 길이도 이 줄이 함께 본다', () => {
    expect(passwordRules('Abcdef1!' + 'x'.repeat(23))).toEqual({
      length: false,
      composition: true,
    });
  });
  it('특수문자가 없으면 구성만 false', () => {
    expect(passwordRules('Abcdefg1xy')).toEqual({ length: true, composition: false });
  });
  it('비어 있으면 둘 다 false', () => {
    expect(passwordRules('')).toEqual({ length: false, composition: false });
  });
});

describe('validatePasswordConfirm', () => {
  it('같으면 null', () => {
    expect(validatePasswordConfirm('Abcdef1!xy', 'Abcdef1!xy')).toBeNull();
  });
  it('다르면 문구', () => {
    expect(validatePasswordConfirm('Abcdef1!xy', 'Abcdef1!xz')).toBe(
      '비밀번호가 일치하지 않습니다'
    );
  });
});

describe('validateName / validateNickname', () => {
  it('2~10자면 null', () => {
    expect(validateName('강주현')).toBeNull();
    expect(validateNickname('주현')).toBeNull();
  });
  it('1자면 문구', () => {
    expect(validateName('강')).toBe('이름은 2~10자 이하이어야 합니다.');
    expect(validateNickname('주')).toBe('닉네임은 2~10자 이하이어야 합니다.');
  });
  it('11자면 문구', () => {
    expect(validateName('가'.repeat(11))).toBe('이름은 2~10자 이하이어야 합니다.');
  });
});

describe('validateBirthDate', () => {
  // 오늘을 고정한다. 안 그러면 만 14세 경계 테스트가 내년에 깨진다.
  //
  // ⚠️ **시간대를 붙이지 마라.** `'2026-07-31T00:00:00+09:00'` 은 「한국시간 7/31 자정」이라는
  //    **순간**인데, `validateBirthDate` 는 그 순간을 **기기의 지역 날짜**로 읽는다
  //    (`getFullYear`·`getMonth`·`getDate`). 그래서 UTC 기계에서는 같은 순간이 **7월 30일**이라
  //    「생일이 아직 안 왔다」가 되어 이 시험만 떨어진다.
  //
  //      TZ=Asia/Seoul   지역 날짜 7/31 → 생일 지남 → null      ✅
  //      TZ=UTC          지역 날짜 7/30 → 생일 안 지남 → 문구   ❌
  //
  //    **개발자 맥이 한국시간이라 여태 안 드러났고, CI(UTC)를 붙인 첫 PR 에서 잡혔다**
  //    (#1017 · 2026-08-22).
  //
  //    시간대를 안 붙이면 **지역 시간으로** 해석되어 어느 기계에서나 「오늘은 7월 31일」이 된다.
  //    앱은 사용자 기기의 지역 시간으로 나이를 세므로 그것이 이 시험의 진짜 뜻이다.
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-31T00:00:00'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('만 14세를 하루 넘겼으면 null', () => {
    expect(validateBirthDate('2012', '07', '30')).toBeNull();
  });
  it('생일 당일이면 null (만 14세가 된 날)', () => {
    expect(validateBirthDate('2012', '07', '31')).toBeNull();
  });
  it('생일 하루 전이면 문구', () => {
    expect(validateBirthDate('2012', '08', '01')).toBe('만 14세 이상만 가입할 수 있습니다');
  });
  it('없는 날짜면 문구', () => {
    expect(validateBirthDate('2012', '02', '31')).toBe('생년월일을 확인해주세요');
  });
  it('비어 있으면 문구', () => {
    expect(validateBirthDate('', '', '')).toBe('생년월일을 입력해주세요');
  });
});

describe('formatBirthDate', () => {
  it('한 자리도 0을 채워 YYYY-MM-DD로 만든다', () => {
    expect(formatBirthDate('2000', '3', '7')).toBe('2000-03-07');
  });

  // 「추가 정보 입력」 화면(app/social-signup.tsx)도 이 함수로 세 칸을 합친다.
  // 0을 안 채우면 「1988-4-3」이 되어 서버가 못 읽거나 엉뚱한 날로 저장된다 —
  // 화면에서는 멀쩡해 보이고 저장도 성공한 것처럼 보이는, 조용한 종류의 오류다.
  it('한 자리 월·일에 0을 채운다', () => {
    expect(formatBirthDate('1988', '4', '3')).toBe('1988-04-03');
  });

  it('두 자리는 그대로 둔다', () => {
    expect(formatBirthDate('1988', '12', '25')).toBe('1988-12-25');
  });

  it('서버가 준 모양과 같다 — GET /profile/me가 "1988-04-03"으로 준다', () => {
    expect(formatBirthDate('1988', '04', '03')).toBe('1988-04-03');
  });
});
