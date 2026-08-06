import { normalizeKeyword } from './search';

describe('normalizeKeyword', () => {
  it('앞뒤 공백을 뗀다', () => {
    expect(normalizeKeyword('  강아지  ')).toBe('강아지');
  });

  it('빈 문자열이면 null', () => {
    expect(normalizeKeyword('')).toBeNull();
  });

  it('공백만 있으면 null', () => {
    expect(normalizeKeyword('   ')).toBeNull();
  });

  it('탭·줄바꿈만 있어도 null (trim이 걷어내는 공백류)', () => {
    expect(normalizeKeyword('\t\n')).toBeNull();
  });

  it('가운데 공백은 남긴다', () => {
    expect(normalizeKeyword('강아지 사료')).toBe('강아지 사료');
  });

  it('보통 글자는 그대로', () => {
    expect(normalizeKeyword('사료')).toBe('사료');
  });
});
