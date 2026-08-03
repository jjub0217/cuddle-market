import { describe, expect, it } from 'vitest'

import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from './productOptions'
import { getCategoryLabel, getPetDetailLabel } from '../lib/petLabels'
import { getProductStatusLabel } from '../lib/productLabels'

// 폼에서 고를 목록. 지금까지 있던 라벨 맵은 코드→한글 한 방향이라 목록을 못 만들었다.
//
// ⚠️ 값은 서버 enum과 정확히 같아야 한다. 하나라도 어긋나면 등록이 400으로 막힌다.

describe('카테고리', () => {
  it('서버 enum 여덟 개를 다 담는다', () => {
    // 순서는 화면이 정하는 것이라 안 본다. 무엇이 들어 있는지만 본다
    expect(CATEGORY_OPTIONS.map((o) => o.code).sort()).toEqual(
      ['CLOTHING', 'ETC', 'FOOD', 'GROOMING', 'HEALTH', 'HOUSE', 'TOY', 'WALKING'].sort()
    )
  })

  it('라벨이 기존 라벨 맵과 같다', () => {
    // 같은 코드가 목록에서와 상세에서 다른 이름으로 보이면 안 된다
    for (const option of CATEGORY_OPTIONS) {
      expect(option.label).toBe(getCategoryLabel(option.code))
    }
  })
})

describe('상품 상태', () => {
  it('서버 enum 넷을 다 담는다', () => {
    expect(PRODUCT_STATUS_OPTIONS.map((o) => o.code).sort()).toEqual(
      ['LIKE_NEW', 'NEED_REPAIR', 'NEW', 'USED'].sort()
    )
  })

  it('라벨이 기존 라벨 맵과 같다', () => {
    for (const option of PRODUCT_STATUS_OPTIONS) {
      expect(option.label).toBe(getProductStatusLabel(option.code))
    }
  })
})

describe('펫 종류', () => {
  // ⚠️ 서버 PetType enum은 열 개지만 **ETC는 목록에서 뺀다.**
  //    petDetailType이 필수인데(@NotNull) ETC에 딸린 세부 종류가 서버에 하나도 없다
  //    (PetDetailType 40개에 ETC가 없다). 넣으면 고른 뒤 다음 칸에서 막힌다.
  //    웹 PETS도 같은 이유로 아홉 개만 담는다.
  it('고를 수 있는 아홉 종류를 담는다 (ETC는 뺀다)', () => {
    expect(PET_TYPE_OPTIONS.map((o) => o.code).sort()).toEqual(
      [
        'AMPHIBIAN',
        'AMPHIBIAN_REAL',
        'BIRD',
        'CRUSTACEAN',
        'FISH',
        'MAMMAL',
        'PLANT',
        'REPTILE',
        'RODENT',
      ].sort()
    )
  })

  it('ETC는 안 담는다', () => {
    // 고르면 막다른 길이 된다
    expect(PET_TYPE_OPTIONS.map((o) => o.code)).not.toContain('ETC')
  })

  it('종류마다 세부 종류가 하나 이상 있다', () => {
    // 세부가 빈 종류를 고르면 다음 칸에서 고를 게 없어 막힌다
    for (const type of PET_TYPE_OPTIONS) {
      expect(PET_DETAIL_OPTIONS_BY_TYPE[type.code]?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('세부 종류를 다 합치면 40개다', () => {
    // 서버 PetDetailType과 같은 수 (2026-08-03에 세어 확인)
    const all = Object.values(PET_DETAIL_OPTIONS_BY_TYPE).flat()
    expect(all).toHaveLength(40)
  })

  it('세부 종류 코드가 겹치지 않는다', () => {
    // 같은 코드가 두 종류에 걸쳐 있으면 어느 쪽으로 되돌릴지 알 수 없다
    const codes = Object.values(PET_DETAIL_OPTIONS_BY_TYPE)
      .flat()
      .map((o) => o.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('세부 라벨이 기존 라벨 맵과 같다', () => {
    for (const option of Object.values(PET_DETAIL_OPTIONS_BY_TYPE).flat()) {
      expect(option.label).toBe(getPetDetailLabel(option.code))
    }
  })
})
