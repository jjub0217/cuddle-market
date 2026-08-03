'use client'

import { useForm, useWatch } from 'react-hook-form'
import Button from '@/components/commons/button/Button'
import { type Province } from '@/constants/cities'
import { useRouter } from 'next/navigation'
import ProductImageUpload from './imageUploadField/ImageUploadField'
import BasicInfoSection from './basicInfoSection/BasicInfoSection'
import PriceAndStatusSection from './priceAndStatusSection/PriceAndStatusSection'
import type { ProductDetailItem, ProductPostRequestData } from '@/types'
import { fetchGraphQL } from '@/lib/api/graphql'
import { cn } from '@/lib/utils/cn'
import { useEffect, useMemo, useState } from 'react'
import TradeInfoSection from './tradeInfoSection/TradeInfoSection'
import Spinner from '@/components/commons/spinner/Spinner'
import { IMAGE_PROCESSING_DELAY } from '@/constants/constants'

export interface ProductPostFormValues {
  petType: string
  petDetailType: string
  category: string
  title: string
  description: string
  price: number
  productStatus: string
  mainImageUrl: string
  subImageUrls?: string[]
  addressSido: Province | ''
  addressGugun: string
}

interface ProductPostFormProps {
  isEditMode?: boolean
  productId?: string
  initialData?: ProductDetailItem | null
}

export function ProductPostForm({ isEditMode, productId: id, initialData }: ProductPostFormProps) {
  const {
    control,
    handleSubmit, // form onSubmit에 들어가는 함수 : 제출 시 실행할 함수를 감싸주는 함수
    register, // onChange 등의 이벤트 객체 생성 : input에 "이 필드는 폼의 어떤 이름이다"라고 연결해주는 함수
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isValid }, // errors: Controller/register의 에러 메세지 자동 출력 : 각 필드의 에러 상태
  } = useForm<ProductPostFormValues>({
    mode: 'onChange',
    defaultValues: {
      petType: '',
      petDetailType: '',
      category: '',
      title: '',
      description: '',
      price: 0,
      productStatus: '',
      mainImageUrl: '',
      subImageUrls: [],
      addressSido: '',
      addressGugun: '',
    },
  }) // 폼에서 관리할 필드들의 타입(이름) 정의.
  const titleLength = useWatch({ control, name: 'title' })?.length ?? 0
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialImages = useMemo(() => {
    if (initialData) {
      return [initialData.mainImageUrl, ...(initialData.subImageUrls || [])].filter(Boolean)
    }
    return []
  }, [initialData])

  const onSubmit = async (data: ProductPostFormValues) => {
    const requestData: ProductPostRequestData = {
      petType: data.petType,
      petDetailType: data.petDetailType,
      category: data.category,
      title: data.title,
      description: data.description,
      price: Number(data.price),
      productStatus: data.productStatus,
      mainImageUrl: data.mainImageUrl,
      subImageUrls: data.subImageUrls ?? [],
      addressSido: data.addressSido,
      addressGugun: data.addressGugun,
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && id) {
        // 편집 모드: 기존 상품 ID로 이동
        await fetchGraphQL(`
          mutation UpdateProduct($id: Int!, $input: ProductInput!) {
            updateProduct(id: $id, input: $input) { success }
          }
        `, { id: Number(id), input: requestData })
        // Lambda 이미지 리사이징 처리 대기
        await new Promise((resolve) => setTimeout(resolve, IMAGE_PROCESSING_DELAY))
        router.push(`/products/${id}`)
      } else {
        // 새 등록: 서버에서 생성된 ID로 이동
        const { createProduct: createdProduct } = await fetchGraphQL<{ createProduct: { id: number } }>(`
          mutation CreateProduct($input: ProductInput!) {
            createProduct(input: $input) { id }
          }
        `, { input: requestData })
        // Lambda 이미지 리사이징 처리 대기
        await new Promise((resolve) => setTimeout(resolve, IMAGE_PROCESSING_DELAY))
        router.push(`/products/${createdProduct.id}`)
      }
    } catch {
      setIsSubmitting(false)
      alert(isEditMode ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.')
    }
  }
  useEffect(() => {
    if (isEditMode && initialData) {
      reset({
        title: initialData.title,
        description: initialData.description,
        price: initialData.price,
        petType: initialData.petType,
        petDetailType: initialData.petDetailType,
        category: initialData.category,
        productStatus: initialData.productStatus,
        mainImageUrl: initialData.mainImageUrl,
        subImageUrls: initialData.subImageUrls ?? [],
        addressSido: initialData.addressSido as Province | '',
        addressGugun: initialData.addressGugun,
      })
    }
  }, [isEditMode, initialData, reset])

  if (isSubmitting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" />
          <p className="text-gray-600">상품을 {isEditMode ? '수정' : '등록'}하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div role="tabpanel" id="panel-SELL" aria-labelledby="tab-sales">
      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="flex flex-col gap-5">
          <legend className="sr-only">상품 등록폼</legend>
          <div className="flex flex-col gap-5">
            <ProductImageUpload
              initialImages={initialImages}
              setValue={setValue}
              errors={errors}
              setError={setError}
              clearErrors={clearErrors}
              mainImageField="mainImageUrl"
              subImagesField="subImageUrls"
              description="첫번째 이미지가 대표 이미지가 됩니다. 드래그 또는 클릭으로 최대 5장 업로드 (각 5MB 이하)"
            />
            <BasicInfoSection control={control} setValue={setValue} register={register} errors={errors} titleLength={titleLength} />
            <PriceAndStatusSection register={register} errors={errors} />
            <TradeInfoSection control={control} setValue={setValue} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {/* 좁은 폭에서는 숨긴다 — 헤더의 ← 화살표(MobileBackHeader)가 하는 일과 같고,
                「등록」 바로 옆이라 잘못 누르면 쓰던 것이 확인 없이 날아간다.
                넓은 폭에는 그 화살표가 없어(md:hidden) 나갈 다른 길이 화면에 없으므로 남긴다. */}
            <button
              type="button"
              onClick={() => router.back()}
              className="text-primary hover:bg-surface-container-high hidden cursor-pointer rounded-full px-8 py-3.5 text-sm font-bold transition-colors md:block"
            >
              취소
            </button>
            {/* 좁은 폭에서는 폭을 꽉 채운다 — 이 화면에서 할 유일한 행동이고,
                엄지가 닿는 자리가 넓을수록 누르기 쉽다. */}
            <Button
              type="submit"
              disabled={!isValid}
              variant={isValid ? 'primary' : 'default'}
              className={cn(
                'w-full cursor-pointer rounded-full px-8 py-3.5 text-sm font-bold transition-all md:w-auto',
                !isValid && 'cursor-not-allowed bg-gray-200 text-gray-400'
              )}
            >
              {isEditMode ? '수정 완료' : '등록'}
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
