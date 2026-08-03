import { PRODUCT_STATUS_OPTIONS } from '@cuddle/shared';

import {
  DEFAULT_PRODUCT_STATUS,
  firstErrorField,
  isTextField,
  hasErrors,
  validateProductForm,
  type ProductFormValues,
} from './product-form';

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

describe('미리 골라 두는 상품 상태', () => {
  // 오타가 나면 알약이 하나도 안 채워진 채로 보이고, 그대로 보내면 서버가 400으로 막는다.
  // 화면을 안 켜 보면 모르는 자리라 여기서 잡는다.
  it('고를 수 있는 값 안에 있다', () => {
    const codes = PRODUCT_STATUS_OPTIONS.map((option) => option.code);

    expect(codes).toContain(DEFAULT_PRODUCT_STATUS);
  });

  it('미리 골라 둔 값은 검사를 통과한다', () => {
    const errors = validateProductForm(values({ productStatus: DEFAULT_PRODUCT_STATUS }));

    expect(errors.productStatus).toBeUndefined();
  });
});

describe('처음 걸린 칸 찾기', () => {
  // 등록하기를 눌렀는데 화면 밖에서 막히면 사용자에게는 「아무 일도 안 일어난 것」과 같다.
  // 그래서 막힌 칸으로 화면을 옮겨 주는데, **어느 칸으로 갈지**를 여기서 정한다.
  //
  // ⚠️ 화면에 그리는 차례와 같아야 한다. 상품명 → 반려동물 종류(대·소) → 카테고리 →
  //    상품 상태 → 판매 가격 → 상품 설명 → 거래 희망 지역.
  //    폼의 차례를 바꾸면 이 시험이 깨져서 알려 준다.

  it('아무 데도 안 걸렸으면 null', () => {
    expect(firstErrorField({})).toBeNull();
  });

  it('하나면 그 칸', () => {
    expect(firstErrorField({ price: '가격을 입력해주세요' })).toBe('price');
  });

  it('여럿이면 **화면에서 가장 위**에 있는 칸', () => {
    const found = firstErrorField({
      addressGugun: '지역을 선택해주세요',
      price: '가격을 입력해주세요',
      title: '상품명을 입력해주세요',
    });

    expect(found).toBe('title');
  });

  it('아래쪽 칸끼리도 차례를 지킨다', () => {
    const found = firstErrorField({
      addressGugun: '지역을 선택해주세요',
      description: '상품설명을 입력해주세요',
    });

    expect(found).toBe('description');
  });

  it('소분류는 대분류 다음이다 — 둘 다 걸리면 대분류로 간다', () => {
    const found = firstErrorField({
      petDetailType: '소분류를 선택해주세요',
      petType: '대분류를 선택해주세요(예: 포유류)',
    });

    expect(found).toBe('petType');
  });

  it('빈 폼을 검사하면 맨 위 칸(상품명)이 나온다', () => {
    const errors = validateProductForm(
      values({
        title: '',
        description: '',
        price: '',
        petType: '',
        petDetailType: '',
        category: '',
        productStatus: '',
        addressSido: '',
        addressGugun: '',
      })
    );

    expect(firstErrorField(errors)).toBe('title');
  });
});

describe('글자를 치는 칸인가', () => {
  // 막힌 칸으로 화면을 옮길 때 **커서도 같이 옮겨야** 한다.
  // 안 옮기면 사용자는 상품명을 보면서 가격 칸에 글자를 친다 — 실기기에서 나온 일이다.
  // 고르는 칸(카테고리 등)은 자판이 없으니 옮길 커서도 없다. 대신 자판을 내린다.

  it('치는 칸', () => {
    expect(isTextField('title')).toBe(true);
    expect(isTextField('price')).toBe(true);
    expect(isTextField('description')).toBe(true);
  });

  it('눌러서 고르는 칸', () => {
    expect(isTextField('petType')).toBe(false);
    expect(isTextField('petDetailType')).toBe(false);
    expect(isTextField('category')).toBe(false);
    expect(isTextField('productStatus')).toBe(false);
    expect(isTextField('addressGugun')).toBe(false);
  });
});
