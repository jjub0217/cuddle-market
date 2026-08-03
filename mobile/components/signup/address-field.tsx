import { RegionField } from '@/components/products/region-field';

import type { useSignupForm } from '@/lib/signup/use-signup-form';

// 거주지. 그리는 알맹이는 RegionField가 들고 있다 — 상품 등록 화면도 같은 칸을 쓴다.
// 여기는 가입 폼 훅과 RegionField 사이를 이어주기만 한다.
//
// 웹에서도 필수다 — CascadingSelectField가 Controller에 required 규칙을 걸어 제출을 막는다.

interface Props {
  form: ReturnType<typeof useSignupForm>;
  /** 목록을 열기 전에 키보드를 내린다. 안 내리면 앞 칸에서 올라온 키보드가 거주지를 덮는다. */
  onOpen?: () => void;
}

export function AddressField({ form, onOpen }: Props) {
  const { values, errors } = form;

  return (
    <RegionField
      sido={values.addressSido}
      gugun={values.addressGugun}
      error={errors.addressSido ?? errors.addressGugun}
      onChange={(sido, gugun) => {
        // 안 바뀐 값에는 setValue를 부르지 않는다. setValue가 그 칸의 오류 문구를 같이
        // 지우기 때문에, 구/군만 골랐는데 시/도를 다시 넣으면 「거주지를 선택해주세요」가
        // 떼어내기 전과 다른 순간에 사라진다. 옮기기 전 동작을 그대로 지킨다.
        if (sido !== values.addressSido) form.setValue('addressSido', sido);
        if (gugun !== values.addressGugun) form.setValue('addressGugun', gugun);
      }}
      onOpen={onOpen}
    />
  );
}
