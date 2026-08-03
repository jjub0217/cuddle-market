// 폼에서 **고를** 목록. 웹·앱이 같이 쓴다.
//
// lib/petLabels·productLabels의 맵은 코드 → 한글 **한 방향**이라 읽을 때만 쓸 수 있다.
// 여기는 반대로 「무엇을 고를 수 있나」를 준다.
//
// ⚠️ 코드값은 서버 enum과 정확히 같아야 한다. 하나라도 어긋나면 등록이 400으로 막힌다.
//    근거: 웹 constants.ts의 PETS(23~119줄) · PRODUCT_CATEGORIES(154~163줄) ·
//          CONDITION_ITEMS(146~151줄). 서버는 PetType.java · PetDetailType.java ·
//          Category.java · ProductStatus.java.

export interface Option {
  /** 서버로 보내는 값 */
  code: string
  /** 화면에 보이는 한글 */
  label: string
}

/**
 * 등록 폼에서 고를 수 있는 동물 종류.
 *
 * ⚠️ 서버 PetType에는 `ETC`도 있지만 여기서는 뺐다. `PetDetailType`에 ETC에 해당하는
 * 세부가 없는데 세부 종류는 서버에서 필수(@NotNull)라, ETC를 고르면 다음 칸에서
 * 고를 게 없어 아예 보낼 수 없다. 웹도 같다 — PetTypeField.tsx가 PETS(아홉 개)만 쓴다.
 */
export const PET_TYPE_OPTIONS: readonly Option[] = [
  { code: 'MAMMAL', label: '포유류' },
  { code: 'BIRD', label: '조류' },
  { code: 'REPTILE', label: '파충류' },
  { code: 'FISH', label: '수생동물' },
  { code: 'AMPHIBIAN', label: '곤충/절지동물' },
  { code: 'AMPHIBIAN_REAL', label: '양서류' },
  { code: 'RODENT', label: '설치류' },
  { code: 'CRUSTACEAN', label: '갑각류' },
  { code: 'PLANT', label: '식물/수초' },
]

/** 종류를 고르면 그 안의 것만 고를 수 있다. 종류를 바꾸면 세부를 비워야 한다 */
export const PET_DETAIL_OPTIONS_BY_TYPE: Readonly<Record<string, readonly Option[]>> = {
  MAMMAL: [
    { code: 'DOG', label: '강아지' },
    { code: 'CAT', label: '고양이' },
    { code: 'RABBIT', label: '토끼' },
    { code: 'HAMSTER', label: '햄스터' },
    { code: 'GUINEA_PIG', label: '기니피그' },
    { code: 'FERRET', label: '페럿' },
    { code: 'CHINCHILLA', label: '친칠라' },
    { code: 'HEDGEHOG', label: '고슴도치' },
  ],
  BIRD: [
    { code: 'BUDGERIGAR', label: '잉꼬' },
    { code: 'PARROT', label: '앵무새' },
    { code: 'CANARY', label: '카나리아' },
    { code: 'LOVEBIRD', label: '모란앵무' },
  ],
  REPTILE: [
    { code: 'LIZARD', label: '도마뱀' },
    { code: 'SNAKE', label: '뱀' },
    { code: 'TURTLE', label: '거북이' },
    { code: 'GECKO', label: '게코' },
  ],
  FISH: [
    { code: 'GOLDFISH', label: '금붕어' },
    { code: 'TROPICAL_FISH', label: '열대어' },
    { code: 'CHERRY_SHRIMP', label: '체리새우' },
    { code: 'SNAIL', label: '달팽이' },
  ],
  AMPHIBIAN: [
    { code: 'CRICKET', label: '귀뚜라미' },
    { code: 'MANTIS', label: '사마귀' },
    { code: 'BEETLE', label: '딱정벌레' },
    { code: 'SPIDER', label: '거미' },
  ],
  AMPHIBIAN_REAL: [
    { code: 'FROG', label: '개구리' },
    { code: 'SALAMANDER', label: '도롱뇽' },
    { code: 'AXOLOTL', label: '우파루파' },
    { code: 'NEWT', label: '트리프로그' },
  ],
  RODENT: [
    { code: 'SQUIRREL', label: '다람쥐' },
    { code: 'MOUSE', label: '마우스' },
    { code: 'RAT', label: '랫' },
    { code: 'GERBIL', label: '저빌' },
  ],
  CRUSTACEAN: [
    { code: 'CRAYFISH', label: '가재' },
    { code: 'HERMIT_CRAB', label: '소라게' },
    { code: 'CRAB', label: '크랩' },
    { code: 'GIANT_CRAB', label: '대게' },
  ],
  PLANT: [
    { code: 'AQUATIC_PLANT', label: '수초' },
    { code: 'MOSS', label: '이끼' },
    { code: 'SUCCULENT', label: '다육이' },
    { code: 'PET_PLANT', label: '반려식물' },
  ],
}

export const CATEGORY_OPTIONS: readonly Option[] = [
  { code: 'FOOD', label: '사료/간식' },
  { code: 'TOY', label: '장난감' },
  { code: 'HOUSE', label: '하우스' },
  { code: 'HEALTH', label: '건강/위생' },
  { code: 'CLOTHING', label: '의류/잡화' },
  { code: 'WALKING', label: '외출용품' },
  { code: 'GROOMING', label: '미용/목욕' },
  { code: 'ETC', label: '기타' },
]

export const PRODUCT_STATUS_OPTIONS: readonly Option[] = [
  { code: 'NEW', label: '새 상품' },
  { code: 'LIKE_NEW', label: '거의 새것' },
  { code: 'USED', label: '사용감 있음' },
  { code: 'NEED_REPAIR', label: '수리 필요' },
]
