// 상품 상세로 가는 주소를 만든다.
//
// 왜 헬퍼가 필요한가: 상세 화면이 **두 스택에 각각** 있다(app/(tabs)/(home)/products/[id].tsx와
// app/(tabs)/(my)/products/[id].tsx). 미는 쪽이 그룹까지 안 적으면 expo-router가 홈 탭으로
// 옮겨간 뒤 거기에 쌓아서, 마이에서 들어왔는데 뒤로 가면 홈이 나온다(실기기에서 확인한 함정).
//
// 수정 화면(app/products/[id]/edit.tsx)은 **루트 스택**이라 자기가 어느 탭에서 열렸는지 모른다.
// 그래서 열 때 그룹을 주소에 담아 넘기고, 끝나면 그 그룹의 상세로 돌아간다.

/** 상세가 살고 있는 탭 스택 */
export type TabGroup = 'home' | 'my';

const GROUPS: readonly TabGroup[] = ['home', 'my'];

/**
 * 넘어온 값에서 탭 그룹을 골라낸다. 글자 하나도 되고, useSegments()가 주는 조각 목록도 된다.
 *
 * 모르는 값이면 홈으로 본다 — 죽은 주소로 보내면 화면이 아예 안 열린다.
 */
export function tabGroupOf(source: string | string[] | undefined): TabGroup {
  if (typeof source === 'string') {
    return GROUPS.find((group) => group === source) ?? 'home';
  }

  if (Array.isArray(source)) {
    // useSegments()는 그룹을 괄호째 준다 — ['(tabs)', '(my)', 'products', '[id]']
    const found = GROUPS.find((group) => source.includes(`(${group})`));
    return found ?? 'home';
  }

  return 'home';
}

/** `/(tabs)/(my)/products/12` 처럼 그룹까지 적힌 주소 */
export function productDetailHref(group: TabGroup, id: number | string): string {
  return `/(tabs)/(${group})/products/${id}`;
}
