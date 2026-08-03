// 상품 등록·수정 폼의 검사 규칙.
//
// 화면에서 떼어 순수 함수로 둔 이유: 규칙이 흩어지면 등록과 수정이 서로 다르게 막는다.
// 서버가 전체 교체를 요구해 두 화면이 같은 값을 보내므로, 막는 규칙도 하나여야 한다.
//
// 문구는 웹 productPostValidationRules에서 그대로 가져왔다
// (src/features/signup/validationRules.ts:80-).
// ⚠️ 「2~ 50」의 이상한 띄어쓰기도 웹 그대로다. 여기만 고치면 웹과 달라진다.

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
