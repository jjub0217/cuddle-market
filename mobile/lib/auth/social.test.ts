import { parseOAuthCallback } from './social';

// 서버가 이렇게 돌려보낸다(OAuth2LoginSuccessHandler):
//   cuddlemarket://oauth?accessToken=…&refreshToken=…
// 실패하면:
//   cuddlemarket://oauth?error=…

describe('parseOAuthCallback', () => {
  it('토큰 둘이 다 있으면 꺼낸다', () => {
    const result = parseOAuthCallback('cuddlemarket://oauth?accessToken=aaa&refreshToken=bbb');

    expect(result).toEqual({ kind: 'tokens', accessToken: 'aaa', refreshToken: 'bbb' });
  });

  it('리프레시 토큰이 없으면 못 쓴다 — 만료됐을 때 되살릴 방법이 없다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth?accessToken=aaa')).toEqual({ kind: 'unknown' });
  });

  it('액세스 토큰이 없어도 못 쓴다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth?refreshToken=bbb')).toEqual({ kind: 'unknown' });
  });

  it('error가 오면 그 문구를 준다', () => {
    const result = parseOAuthCallback(
      'cuddlemarket://oauth?error=%EC%9D%B8%EC%A6%9D%EC%97%90%20%EC%8B%A4%ED%8C%A8%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4',
    );

    expect(result).toEqual({ kind: 'error', message: '인증에 실패했습니다' });
  });

  it('아무 파라미터도 없으면 모른다', () => {
    expect(parseOAuthCallback('cuddlemarket://oauth')).toEqual({ kind: 'unknown' });
  });

  it('주소가 엉망이어도 던지지 않는다 — 던지면 앱이 죽는다', () => {
    expect(parseOAuthCallback('!!! 주소가 아님')).toEqual({ kind: 'unknown' });
  });
});
