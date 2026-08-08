import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  type Option,
} from '@cuddle/shared';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ChipField } from '@/components/products/chip-field';
import { ImageField } from '@/components/products/image-field';
import { PickerField } from '@/components/products/picker-field';
import { RegionField } from '@/components/products/region-field';
import { Field } from '@/components/signup/field';
import { colors } from '@/constants/colors';

import { toImageUrls, type UploadSlot } from '@/lib/product-images';
import {
  firstErrorField,
  hasErrors,
  isTextField,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from '@/lib/product-form';
import type { ProductPayload } from '@/lib/products';

// 등록 화면과 수정 화면이 나눠 쓰는 폼.
//
// 왜 하나인가: 서버가 수정을 **전체 교체**로 받으므로(ProductServiceImpl:235-247) 두 화면이
// 보내는 모양이 똑같다. 폼을 둘로 두면 칸 하나를 더할 때 한쪽만 고치는 일이 생긴다.
//
// 값을 여기서 들고 있고, 화면은 「처음 값」과 「보낼 때 할 일」만 준다. 등록은 빈 값을,
// 수정은 서버에서 받은 값을 넣는다.
//
// ⚠️ 수정 화면은 서버 응답이 온 **뒤에** 이 조각을 그려야 한다. initialValues는 처음 한 번만
//    읽는다(useState의 초기값) — 나중에 바뀌어도 칸이 다시 채워지지 않는다. 사용자가 고치는
//    중에 값이 덮이면 더 나쁘기 때문에 일부러 이렇게 뒀다.

/** 항목 차례는 웹 ProductPostForm과 같다 */
interface Props {
  /** 수정 화면이 서버에서 받은 값을 채워 넣는다. 등록이면 빈 값 */
  initialValues: ProductFormValues;
  initialSlots: UploadSlot[];
  /** 「등록하기」 또는 「수정 완료」 */
  submitLabel: string;
  onSubmit: (payload: ProductPayload) => Promise<void>;
}

const EMPTY_OPTIONS: readonly Option[] = [];

export function ProductForm({ initialValues, initialSlots, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [slots, setSlots] = useState<UploadSlot[]>(initialSlots);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // 막힌 칸으로 화면을 옮기려면 그 칸이 **어디쯤 있는지**를 알아야 한다.
  // 그릴 때마다 onLayout이 알려 주는 y를 여기 적어 둔다(다시 그리게 할 값이 아니라 ref로).
  const scroller = useRef<ScrollView>(null);
  const spots = useRef<Partial<Record<keyof ProductFormValues, number>>>({});

  // 글자를 치는 칸의 손잡이. 막히면 이 칸으로 커서를 옮긴다
  const inputs = {
    title: useRef<TextInput>(null),
    price: useRef<TextInput>(null),
    description: useRef<TextInput>(null),
  };

  // 칸 하나가 이름 여럿을 맡기도 한다 — 반려동물 종류는 대·소분류가 한 묶음이라
  // 소분류만 걸려도 같은 자리로 간다(둘이 붙어 있어 한 화면에 같이 보인다).
  const rememberSpot =
    (...keys: (keyof ProductFormValues)[]) =>
    (event: LayoutChangeEvent) => {
      const { y } = event.nativeEvent.layout;
      for (const key of keys) spots.current[key] = y;
    };

  /**
   * 막힌 칸 중 가장 위에 있는 것으로 화면을 옮긴다.
   *
   * 왜 필요한가: 등록하기는 화면 맨 아래에 붙어 있는데 막힌 칸은 위에 있을 수 있다.
   * 그러면 빨간 글씨가 화면 밖에서 떠서 「눌렀는데 아무 일도 안 일어났다」로 보인다.
   */
  const scrollToFirstError = (found: ProductFormErrors) => {
    const key = firstErrorField(found);
    if (key === null) return;

    // ⚠️ 화면만 옮기고 커서를 두면 **보는 칸과 치는 칸이 어긋난다.**
    //    실기기에서 나온 일: 가격에 커서를 둔 채 등록하기를 누르니 화면은 상품명으로 갔는데
    //    숫자 자판과 커서는 가격에 남아, 거기서 친 숫자가 가격에 붙었다.
    if (isTextField(key)) {
      // 치는 칸이면 커서를 옮긴다 — 자판도 그 칸에 맞는 것으로 바뀐다
      inputs[key as 'title' | 'price' | 'description'].current?.focus();
    } else {
      // 고르는 칸이면 옮길 커서가 없다. 자판이 떠 있으면 내려서 화면을 안 가리게 한다
      Keyboard.dismiss();
    }

    const y = spots.current[key];
    if (y === undefined) return;

    // 칸 이름표가 화면 맨 위에 딱 붙지 않게 조금 위로 더 올린다
    scroller.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  };

  /** 값을 고치면 그 칸의 오류 문구를 지운다 — 고쳤는데 빨간 글이 남아 있으면 아직 틀린 줄 안다 */
  const change = (key: keyof ProductFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ⚠️ 대분류를 바꾸면 소분류를 비운다. 안 그러면 「조류」인데 소분류가 「강아지」인 조합이
  //    서버로 간다(서버는 둘의 짝을 안 따져서 그대로 저장된다).
  const handlePetType = (code: string) => {
    setValues((prev) => ({ ...prev, petType: code, petDetailType: '' }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.petType;
      delete next.petDetailType;
      return next;
    });
  };

  // 시/도·시/군/구는 한 칸이 둘을 함께 준다. 오류도 하나로 붙어 있다(addressGugun).
  const handleRegion = (sido: string, gugun: string) => {
    setValues((prev) => ({ ...prev, addressSido: sido, addressGugun: gugun }));
    setErrors((prev) => {
      if (!prev.addressGugun) return prev;
      const next = { ...prev };
      delete next.addressGugun;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const found = validateProductForm(values);
    setErrors(found);
    if (hasErrors(found)) {
      scrollToFirstError(found);
      return;
    }

    // 아직 안 올라갔거나 실패한 사진은 여기서 빠진다(toImageUrls). 폰 안의 주소는 서버가 못 읽는다.
    const { mainImageUrl, subImageUrls } = toImageUrls(slots);

    setSubmitting(true);
    try {
      await onSubmit({
        petType: values.petType,
        petDetailType: values.petDetailType,
        category: values.category,
        title: values.title.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        productStatus: values.productStatus,
        mainImageUrl,
        subImageUrls,
        addressSido: values.addressSido,
        addressGugun: values.addressGugun,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const detailOptions = PET_DETAIL_OPTIONS_BY_TYPE[values.petType] ?? EMPTY_OPTIONS;

  return (
    /* 목록과 칸을 **함께** 밀어 올린다. 입력칸만 감싸면 키보드가 칸을 덮는다.
       ⚠️ 안드로이드에도 'padding'을 준다. 「안드로이드는 창이 저절로 줄어 안 줘도 된다」는
          옛말이다 — app.json의 edgeToEdgeEnabled가 켜져 있으면 창이 안 줄고 앱이 키보드
          뒤까지 그린다(comment-thread.tsx와 같은 판단, mobile/AGENTS.md 참고). */
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <ImageField slots={slots} onChange={setSlots} />

        <View onLayout={rememberSpot('title')}>
          <Field
            label="상품명"
            required
            inputRef={inputs.title}
            value={values.title}
            onChangeText={(text) => change('title', text)}
            placeholder="예: 강아지 사료 10kg 상품"
            maxLength={50}
            error={errors.title}
          />
        </View>

        {/* 웹 PetTypeField와 같이 이름표 하나(「반려동물 종류」) 아래 고르는 칸 둘을 놓는다.
            소분류에는 이름표가 없다 — 안내 문구가 「소분류를 선택해주세요」라 이미 무슨 칸인지
            보인다. 거주지 칸(region-field.tsx)도 같은 모양이다. */}
        <View onLayout={rememberSpot('petType', 'petDetailType')}>
          <View style={styles.pair}>
            <PickerField
              label="반려동물 종류"
              required
              placeholder="대분류를 선택해주세요(예: 포유류)"
              value={values.petType}
              options={PET_TYPE_OPTIONS}
              error={errors.petType}
              onChange={handlePetType}
            />
            <PickerField
              placeholder="소분류를 선택해주세요"
              value={values.petDetailType}
              options={detailOptions}
              error={errors.petDetailType}
              disabled={!values.petType}
              disabledHint="먼저 대분류를 선택해주세요"
              onChange={(code) => change('petDetailType', code)}
            />
          </View>
        </View>

        <View onLayout={rememberSpot('category')}>
          <PickerField
            label="카테고리"
            required
            placeholder="카테고리를 선택해주세요"
            value={values.category}
            options={CATEGORY_OPTIONS}
            error={errors.category}
            onChange={(code) => change('category', code)}
          />
        </View>

        {/* 웹과 같이 알약을 펼쳐 둔다(ProductStateFilter variant="pill").
            값이 넷뿐이고 글자가 짧아 시트로 감출 이유가 없다 — 감추면 무엇을 고를 수 있는지
            열어 봐야 알고 손도 두 번 간다. 값이 많은 카테고리·지역은 그대로 시트다. */}
        <View onLayout={rememberSpot('productStatus')}>
          <ChipField
            label="상품 상태"
            required
            value={values.productStatus}
            options={PRODUCT_STATUS_OPTIONS}
            error={errors.productStatus}
            onChange={(code) => change('productStatus', code)}
          />
        </View>

        <View onLayout={rememberSpot('price')}>
          <Field
            label="판매 가격"
            required
            inputRef={inputs.price}
            value={values.price}
            onChangeText={(text) => change('price', text)}
            placeholder="0"
            // 숫자 자판. 폰에는 숫자만 있는 자판이 따로 있어 잘못 칠 일이 줄어든다
            keyboardType="number-pad"
            error={errors.price}
            trailing={
              <View style={styles.suffix}>
                <Text style={styles.suffixLabel}>원</Text>
              </View>
            }
          />
        </View>

        <View onLayout={rememberSpot('description')}>
          <Field
            label="상품 설명"
            required
            inputRef={inputs.description}
            value={values.description}
            onChangeText={(text) => change('description', text)}
            placeholder="상품의 상태, 구매 시기, 사용 빈도, 특징 등을 자세히 적어주세요"
            multiline
            maxLength={1000}
            style={styles.textarea}
            error={errors.description}
          />
        </View>

        {/* ⚠️ label을 안 주면 기본값 「거주지」가 나온다 — 가입 화면과 같이 쓰는 칸이다 */}
        <View onLayout={rememberSpot('addressGugun')}>
          <RegionField
            label="거래 희망 지역"
            required
            sido={values.addressSido}
            gugun={values.addressGugun}
            error={errors.addressGugun}
            onChange={handleRegion}
          />
        </View>
      </ScrollView>

      {/* 보내는 단추는 늘 바닥에 붙여 둔다. 칸이 아홉이라 스크롤 끝까지 내려야 나오면 못 찾는다 */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          style={({ pressed }) => [
            styles.submit,
            submitting && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onAction} />
          ) : (
            <Text style={styles.submitLabel}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 16, paddingBottom: 24 },

  // 이름표 하나를 나눠 쓰는 칸 둘(대분류·소분류)은 더 붙여 둔다. 다른 칸과 같은 16이면
  // 따로 노는 두 칸으로 보인다. 6은 region-field가 두 칸 사이에 쓰는 값과 같다.
  pair: { gap: 6 },

  // 가격 칸 오른쪽의 「원」. 입력칸과 키를 맞춰야 글자가 위로 뜨지 않는다
  suffix: { height: 48, justifyContent: 'center' },
  suffixLabel: { fontSize: 15, color: colors.onSurfaceMuted },

  // 여러 줄 칸. Field의 기본 높이(48)를 덮어쓴다.
  // textAlignVertical은 안드로이드에서 글이 가운데로 오지 않게 막는다 — 신고 화면과 같은 값.
  textarea: { height: 120, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },

  // 신고 화면(report.tsx)의 바닥 단추와 같은 모양·같은 색을 쓴다
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  submit: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 15, fontWeight: '600', color: colors.onAction },
  pressed: { opacity: 0.5 },
});
