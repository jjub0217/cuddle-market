// 상품 등록·수정 폼의 검사 규칙.
//
// 화면에서 떼어 순수 함수로 둔 이유: 규칙이 흩어지면 등록과 수정이 서로 다르게 막는다.
// 서버가 전체 교체를 요구해 두 화면이 같은 값을 보내므로, 막는 규칙도 하나여야 한다.
//
// 문구는 웹 productPostValidationRules에서 그대로 가져왔다
// (src/features/signup/validationRules.ts:80-).
// ⚠️ 「2~ 50」의 이상한 띄어쓰기도 웹 그대로다. 여기만 고치면 웹과 달라진다.

/**
 * 등록 화면에 들어갔을 때 미리 골라 두는 상품 상태.
 *
 * ⚠️ **서버가 준 값이 아니다.** 서버에는 기본값이 없다 — ProductStatus enum에도 없고
 *    엔티티는 nullable=false, 요청 DTO는 @NotNull로 막는다(ProductCreateRequest.java:46).
 *    웹도 빈 값으로 시작한다. 이건 앱에서 정한 값이라 언제든 바꿀 수 있다.
 *
 * 값이 PRODUCT_STATUS_OPTIONS에 없는 코드면 알약이 하나도 안 채워진 채로 보이고,
 * 그대로 보내면 서버가 400으로 막는다. product-form.test.ts가 그걸 잡는다.
 */
export const DEFAULT_PRODUCT_STATUS = 'NEW';

export interface ProductFormValues {
  title: string;
  description: string;
  /** 입력칸이 글자를 주므로 글자로 들고 있다가 보낼 때 숫자로 바꾼다 */
  price: string;
  petType: string;
  petDetailType: string;
  category: string;
  productStatus: string;
  addressSido: string;
  addressGugun: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

const TITLE_RANGE = '상품명은 2~ 50자 이하이어야 합니다.';
const DESCRIPTION_RANGE = '상품설명은 2 ~ 1000자 이하이어야 합니다.';

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const title = values.title.trim();
  if (!title) errors.title = '상품명을 입력해주세요';
  else if (title.length < 2 || title.length > 50) errors.title = TITLE_RANGE;

  const description = values.description.trim();
  if (!description) errors.description = '상품설명을 입력해주세요';
  else if (description.length < 2 || description.length > 1000)
    errors.description = DESCRIPTION_RANGE;

  // 숫자가 아닌 글자는 「안 적은 것」과 같이 다룬다 — 「가격은 0원 이상」이라고 하면
  // 「삼만원」이라고 적은 사람에게 도움이 안 된다
  const price = Number(values.price);
  if (!values.price.trim() || Number.isNaN(price)) errors.price = '가격을 입력해주세요';
  else if (price < 0) errors.price = '가격은 0원 이상이어야 합니다';

  if (!values.petType) errors.petType = '대분류를 선택해주세요(예: 포유류)';
  if (!values.petDetailType) errors.petDetailType = '소분류를 선택해주세요';
  if (!values.category) errors.category = '카테고리를 선택해주세요';
  if (!values.productStatus) errors.productStatus = '상품 상태를 선택해주세요';
  // 시도만 고르고 구군을 안 고른 것도 「지역을 안 골랐다」로 다룬다
  if (!values.addressSido || !values.addressGugun) errors.addressGugun = '지역을 선택해주세요';

  return errors;
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * 화면에 그리는 차례. 막힌 칸으로 화면을 옮길 때 「어느 것이 위인가」를 이걸로 정한다.
 *
 * ⚠️ product-form.tsx가 그리는 차례와 **같아야 한다.** 폼에서 칸 자리를 옮기면 여기도 옮긴다
 *    (product-form.test.ts가 어긋남을 잡아 준다).
 * ⚠️ 사진은 없다 — 필수가 아니라 막히는 일이 없다.
 * ⚠️ 지역은 시도·구군이 한 칸이고 오류도 addressGugun 하나로 붙는다.
 */
const FIELD_ORDER: readonly (keyof ProductFormValues)[] = [
  'title',
  'petType',
  'petDetailType',
  'category',
  'productStatus',
  'price',
  'description',
  'addressGugun',
];

/**
 * 걸린 칸 중 **화면에서 가장 위**에 있는 것. 없으면 null.
 *
 * 왜 필요한가: 등록하기는 화면 맨 아래에 붙어 있는데 막힌 칸은 위에 있을 수 있다.
 * 그러면 빨간 글씨가 화면 밖에서 떠서 사용자에게는 「눌렀는데 아무 일도 안 일어난 것」으로 보인다.
 */
export function firstErrorField(errors: ProductFormErrors): keyof ProductFormValues | null {
  return FIELD_ORDER.find((key) => errors[key]) ?? null;
}

/** 글자를 쳐서 넣는 칸. 나머지는 눌러서 고르는 칸이라 자판이 없다 */
const TEXT_FIELDS: readonly (keyof ProductFormValues)[] = ['title', 'price', 'description'];

/**
 * 이 칸이 글자를 치는 칸인가.
 *
 * 왜 필요한가: 막힌 칸으로 화면을 옮길 때 **커서도 같이 옮겨야** 한다. 실기기에서
 * 이런 일이 나왔다 — 가격 칸에 커서를 둔 채 등록하기를 누르니 화면은 상품명으로 갔는데
 * 커서와 숫자 자판은 가격에 남아, 거기서 글자를 치면 **가격에 붙었다.**
 *
 * 고르는 칸이면 옮길 커서가 없으니 자판을 내려서 화면을 가리지 않게 한다.
 */
export function isTextField(key: keyof ProductFormValues): boolean {
  return TEXT_FIELDS.includes(key);
}
