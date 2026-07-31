import {
  formatBirthDate,
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
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-31T00:00:00+09:00'));
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
});
