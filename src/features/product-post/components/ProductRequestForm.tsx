'use client'

import Button from '@/components/commons/button/Button'
import { useForm, useWatch } from 'react-hook-form'
import { type Province } from '@/constants/cities'
import { useRouter } from 'next/navigation'
import ProductImageUpload from './imageUploadField/ImageUploadField'
import BasicInfoSection from './basicInfoSection/BasicInfoSection'
import PriceAndStatusSection from './priceAndStatusSection/PriceAndStatusSection'
import TradeInfoSection from './tradeInfoSection/TradeInfoSection'
import type { ProductDetailItem, RequestProductPostRequestData } from '@/types'
import { patchRequestProduct, requestPostProduct } from '@/lib/api/products'
import { cn } from '@/lib/utils/cn'
import { useEffect, useMemo, useState } from 'react'
import { IMAGE_PROCESSING_DELAY } from '@/constants/constants'

export interface ProductRequestFormValues {
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

interface ProductRequestPostFormProps {
  isEditMode?: boolean
  productId?: string
  initialData?: ProductDetailItem | null
}

export function ProductRequestForm({ isEditMode, productId: id, initialData }: ProductRequestPostFormProps) {
  const {
    control,
    handleSubmit, // form onSubmit에 들어가는 함수 : 제출 시 실행할 함수를 감싸주는 함수
    register, // onChange 등의 이벤트 객체 생성 : input에 "이 필드는 폼의 어떤 이름이다"라고 연결해주는 함수
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isValid }, // errors: register의 에러 메세지 자동 출력 : 각 필드의 에러 상태
  } = useForm<ProductRequestFormValues>({
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

  const onSubmit = async (data: ProductRequestFormValues) => {
    const requestData: RequestProductPostRequestData = {
      petType: data.petType,
      petDetailType: data.petDetailType,
      category: data.category,
      title: data.title,
      description: data.description,
      desiredPrice: Number(data.price),
      mainImageUrl: data.mainImageUrl,
      subImageUrls: data.subImageUrls ?? [],
      addressSido: data.addressSido,
      addressGugun: data.addressGugun,
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && id) {
        // 편집 모드: 기존 상품 ID로 수정
        await patchRequestProduct(requestData, Number(id))
        // Lambda 이미지 리사이징 처리 대기
        await new Promise((resolve) => setTimeout(resolve, IMAGE_PROCESSING_DELAY))
        router.push(`/products/${id}`)
      } else {
        // 새 등록: 서버에서 생성된 ID로 이동
        const response = await requestPostProduct(requestData)
        // Lambda 이미지 리사이징 처리 대기
        await new Promise((resolve) => setTimeout(resolve, IMAGE_PROCESSING_DELAY))
        router.push(`/products/${response.id}`)
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
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">상품을 {isEditMode ? '수정' : '등록'}하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div role="tabpanel" id="panel-REQUEST" aria-labelledby="tab-purchases">
      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="flex flex-col gap-5">
          <legend className="sr-only">판매요청 등록폼</legend>
          <div className="flex flex-col gap-5">
            <BasicInfoSection
              control={control}
              setValue={setValue}
              register={register}
              errors={errors}
              titleLength={titleLength}
              productNameLabel="찾고 있는 상품명"
              productDescriptionLabel="상세 요청사항"
              productDescriptionPlaceHolder="어떤 상품을 찾고 있는지, 원하는 조건(가격대, 상태 등)을 자세히 적어주세요"
            />
            <PriceAndStatusSection
              register={register}
              control={control}
              errors={errors}
              showProductStateFilter={false}
              priceLabel="희망 가격"
              heading="가격"
            />
            <TradeInfoSection control={control} setValue={setValue} />
            <ProductImageUpload
              initialImages={initialImages}
              setValue={setValue}
              errors={errors}
              setError={setError}
              clearErrors={clearErrors}
              mainImageField="mainImageUrl"
              subImagesField="subImageUrls"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button size="md" className={cn('w-[80%] flex-1 cursor-pointer text-white', !isValid ? 'bg-gray-300' : 'bg-primary-300')} type="submit">
              {isEditMode ? '수정' : '등록'}
            </Button>
            <Button size="md" className="w-[20%] cursor-pointer bg-gray-100 text-gray-900" type="button" onClick={() => router.back()}>
              취소
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
