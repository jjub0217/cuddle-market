// 펫 세부종류·상품 카테고리 코드값 → 한글 라벨.
// 근거: 웹 constants.ts의 PETS(details), PRODUCT_CATEGORIES.

const PET_DETAIL_LABELS: Record<string, string> = {
  // 포유류
  DOG: '강아지',
  CAT: '고양이',
  RABBIT: '토끼',
  HAMSTER: '햄스터',
  GUINEA_PIG: '기니피그',
  FERRET: '페럿',
  CHINCHILLA: '친칠라',
  HEDGEHOG: '고슴도치',
  // 조류
  BUDGERIGAR: '잉꼬',
  PARROT: '앵무새',
  CANARY: '카나리아',
  LOVEBIRD: '모란앵무',
  // 파충류
  LIZARD: '도마뱀',
  SNAKE: '뱀',
  TURTLE: '거북이',
  GECKO: '게코',
  // 수생동물
  GOLDFISH: '금붕어',
  TROPICAL_FISH: '열대어',
  CHERRY_SHRIMP: '체리새우',
  SNAIL: '달팽이',
  // 곤충/절지동물
  CRICKET: '귀뚜라미',
  MANTIS: '사마귀',
  BEETLE: '딱정벌레',
  SPIDER: '거미',
  // 양서류
  FROG: '개구리',
  SALAMANDER: '도롱뇽',
  AXOLOTL: '우파루파',
  NEWT: '트리프로그',
  // 설치류
  SQUIRREL: '다람쥐',
  MOUSE: '마우스',
  RAT: '랫',
  GERBIL: '저빌',
  // 갑각류
  CRAYFISH: '가재',
  HERMIT_CRAB: '소라게',
  CRAB: '크랩',
  GIANT_CRAB: '대게',
  // 식물/수초
  AQUATIC_PLANT: '수초',
  MOSS: '이끼',
  SUCCULENT: '다육이',
  PET_PLANT: '반려식물',
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '사료/간식',
  TOY: '장난감',
  HOUSE: '하우스',
  HEALTH: '건강/위생',
  CLOTHING: '의류/잡화',
  WALKING: '외출용품',
  GROOMING: '미용/목욕',
  ETC: '기타',
}

/** 펫 세부종류 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getPetDetailLabel(code: string): string {
  return PET_DETAIL_LABELS[code] ?? code
}

/** 상품 카테고리 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] ?? code
}
