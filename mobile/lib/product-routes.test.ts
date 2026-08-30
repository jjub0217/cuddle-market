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
    // ⚠️ **괄호가 있는 모양과 없는 모양을 둘 다 넣는다**(#1101). #1096 에서 홈만 괄호로
    //    남기고 넷은 뗐다 — 그래서 `useSegments()` 가 주는 값이 탭마다 다르다.
    //
    //      마이   ['(tabs)', 'my',     'products', '[id]']    ← 괄호가 없다
    //      홈     ['(tabs)', '(home)', 'products', '[id]']    ← 괄호가 있다
    //
    //    옛 모양(`'(my)'`)만 시험하면 `tabGroupOf` 에서 괄호 없는 쪽을 보는 줄을 지워도
    //    **시험이 초록으로 통과한다.** 그러면 마이에서 상세로 들어갔다 뒤로 갈 때
    //    홈으로 튀는데 아무도 못 잡는다.
    expect(tabGroupOf(['(tabs)', 'my', 'products', '[id]'])).toBe('my');
    expect(tabGroupOf(['(tabs)', '(home)', 'products', '[id]'])).toBe('home');
    expect(tabGroupOf(['products', '[id]', 'edit'])).toBe('home');
  });

  it('괄호를 씌운 옛 모양도 알아본다', () => {
    // 괄호를 다시 씌우는 일이 생겨도(#1096 주석의 경고) 이 함수는 버티게 둔다.
    // 지금 실제로 오는 값은 위 시험의 괄호 없는 쪽이다.
    expect(tabGroupOf(['(tabs)', '(my)', 'products', '[id]'])).toBe('my');
  });
});

describe('productDetailHref', () => {
  it('그룹까지 적힌 주소를 만든다', () => {
    expect(productDetailHref('my', 12)).toBe('/(tabs)/my/products/12');
    expect(productDetailHref('home', 12)).toBe('/(tabs)/(home)/products/12');
  });
});
