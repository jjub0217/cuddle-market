import { hasErrors, validateProductForm, type ProductFormValues } from './product-form';

// 문구는 웹 productPostValidationRules(src/features/signup/validationRules.ts:80-)에서
// 그대로 가져왔다. 같은 화면이 웹과 앱에서 다른 말을 하면 안 된다.
//
// ⚠️ 「상품명은 2~ 50자」의 띄어쓰기가 이상해 보여도 웹 그대로다. 고치지 마라 —
//    고치려면 웹도 같이 고쳐야 한다.

function values(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    title: '강아지 사료 10kg',
    description: '거의 새것입니다. 한 번만 열었어요.',
    price: '30000',
    petType: 'MAMMAL',
    petDetailType: 'DOG',
    category: 'FOOD',
    productStatus: 'LIKE_NEW',
    addressSido: '서울특별시',
    addressGugun: '강남구',
    ...overrides,
  };
}

describe('다 채웠을 때', () => {
  it('오류가 없다', () => {
    expect(validateProductForm(values())).toEqual({});
    expect(hasErrors({})).toBe(false);
  });
});

describe('상품명', () => {
  it('비면 막는다', () => {
    expect(validateProductForm(values({ title: '' })).title).toBe('상품명을 입력해주세요');
  });

  it('공백만 있어도 막는다', () => {
    expect(validateProductForm(values({ title: '   ' })).title).toBe('상품명을 입력해주세요');
  });

  it('한 글자면 막는다', () => {
    expect(validateProductForm(values({ title: '가' })).title).toBe(
      '상품명은 2~ 50자 이하이어야 합니다.'
    );
  });

  it('50자는 된다', () => {
    expect(validateProductForm(values({ title: '가'.repeat(50) })).title).toBeUndefined();
  });

  it('51자면 막는다', () => {
    expect(validateProductForm(values({ title: '가'.repeat(51) })).title).toBe(
      '상품명은 2~ 50자 이하이어야 합니다.'
    );
  });
});

describe('상품 설명', () => {
  // ⚠️ 서버는 선택으로 받지만 웹이 필수로 막는다. 앱은 웹을 따른다
  it('비면 막는다', () => {
    expect(validateProductForm(values({ description: '' })).description).toBe(
      '상품설명을 입력해주세요'
    );
  });

  it('1000자는 된다', () => {
    expect(
      validateProductForm(values({ description: '가'.repeat(1000) })).description
    ).toBeUndefined();
  });

  it('1001자면 막는다', () => {
    expect(validateProductForm(values({ description: '가'.repeat(1001) })).description).toBe(
      '상품설명은 2 ~ 1000자 이하이어야 합니다.'
    );
  });
});

describe('가격', () => {
  it('비면 막는다', () => {
    expect(validateProductForm(values({ price: '' })).price).toBe('가격을 입력해주세요');
  });

  it('0원은 된다', () => {
    // 나눔이 있다
    expect(validateProductForm(values({ price: '0' })).price).toBeUndefined();
  });

  it('음수는 막는다', () => {
    expect(validateProductForm(values({ price: '-1' })).price).toBe('가격은 0원 이상이어야 합니다');
  });

  it('숫자가 아니면 막는다', () => {
    expect(validateProductForm(values({ price: '삼만원' })).price).toBe('가격을 입력해주세요');
  });
});

describe('고르는 값들', () => {
  it('카테고리를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ category: '' })).category).toBe('카테고리를 선택해주세요');
  });

  it('상품 상태를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ productStatus: '' })).productStatus).toBe(
      '상품 상태를 선택해주세요'
    );
  });

  it('펫 종류를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ petType: '' })).petType).toBe(
      '대분류를 선택해주세요(예: 포유류)'
    );
  });

  it('세부 종류를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ petDetailType: '' })).petDetailType).toBe(
      '소분류를 선택해주세요'
    );
  });

  it('지역을 안 고르면 막는다', () => {
    expect(validateProductForm(values({ addressGugun: '' })).addressGugun).toBe(
      '지역을 선택해주세요'
    );
  });

  it('시도만 고르고 구군을 안 고르면 막는다', () => {
    expect(
      validateProductForm(values({ addressSido: '서울특별시', addressGugun: '' })).addressGugun
    ).toBe('지역을 선택해주세요');
  });
});

describe('hasErrors', () => {
  it('하나라도 있으면 true', () => {
    expect(hasErrors({ title: '상품명을 입력해주세요' })).toBe(true);
  });

  it('비었으면 false', () => {
    expect(hasErrors({})).toBe(false);
  });
});
