import { productDetailHref, tabGroupOf } from './product-routes';

// 상품 상세는 **두 스택에 각각** 있다(홈·마이). 미는 쪽이 그룹까지 적어야
// 온 자리로 되돌아간다 — 안 적으면 expo-router가 홈 탭으로 옮겨간 뒤 거기에 쌓는다.
//
// 수정 화면은 루트 스택이라 자기가 어느 탭에서 열렸는지 모른다. 그래서 열 때 그룹을
// 함께 넘기고, 끝나면 그 그룹의 상세로 돌아간다.

describe('tabGroupOf', () => {
  it('아는 그룹은 그대로', () => {
    expect(tabGroupOf('home')).toBe('home');
    expect(tabGroupOf('my')).toBe('my');
  });

  it('모르는 값·빈 값이면 홈으로 — 죽은 주소로 보내는 것보다 낫다', () => {
    expect(tabGroupOf(undefined)).toBe('home');
    expect(tabGroupOf('')).toBe('home');
    expect(tabGroupOf('community')).toBe('home');
  });

  it('주소 조각 목록에서도 찾아낸다', () => {
    expect(tabGroupOf(['(tabs)', '(my)', 'products', '[id]'])).toBe('my');
    expect(tabGroupOf(['(tabs)', '(home)', 'products', '[id]'])).toBe('home');
    expect(tabGroupOf(['products', '[id]', 'edit'])).toBe('home');
  });
});

describe('productDetailHref', () => {
  it('그룹까지 적힌 주소를 만든다', () => {
    expect(productDetailHref('my', 12)).toBe('/(tabs)/(my)/products/12');
    expect(productDetailHref('home', 12)).toBe('/(tabs)/(home)/products/12');
  });
});
