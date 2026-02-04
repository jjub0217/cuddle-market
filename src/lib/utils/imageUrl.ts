import Placeholder150 from '@/assets/images/placeholder-150.webp'
import Placeholder400 from '@/assets/images/placeholder-400.webp'
import Placeholder800 from '@/assets/images/placeholder-800.webp'

type ImageSize = 150 | 400 | 800

// Placeholder 이미지 (크기별) - Next.js에서는 StaticImageData이므로 .src 사용
export const PLACEHOLDER_IMAGES = {
  150: Placeholder150.src,
  400: Placeholder400.src,
  800: Placeholder800.src,
} as const

/**
 * Placeholder srcset 생성
 */
export const PLACEHOLDER_SRCSET = `${Placeholder150.src} 150w, ${Placeholder400.src} 400w, ${Placeholder800.src} 800w`

/**
 * 원본 이미지 URL을 리사이즈된 WebP URL로 변환
 * @param originalUrl - API에서 받은 원본 이미지 URL (예: https://.../uuid.jpg)
 * @param size - 원하는 크기 (150 | 400 | 800)
 * @returns 리사이즈된 WebP URL (예: https://.../uuid_150.webp)
 */
export function toResizedWebpUrl(originalUrl: string | null | undefined, size: ImageSize): string {
  if (!originalUrl) return ''
  return originalUrl.replace(/\.[^.]+$/, `_${size}.webp`)
}

/**
 * srcset용 이미지 URL 세트 생성
 * @param originalUrl - API에서 받은 원본 이미지 URL
 * @returns srcset 문자열 (예: "url_150.webp 150w, url_400.webp 400w, url_800.webp 800w")
 */
export function getImageSrcSet(originalUrl: string | null | undefined): string {
  if (!originalUrl) return ''
  return `${toResizedWebpUrl(originalUrl, 150)} 150w, ${toResizedWebpUrl(originalUrl, 400)} 400w, ${toResizedWebpUrl(originalUrl, 800)} 800w`
}

/**
 * 사전 정의된 sizes 값
 */
export const IMAGE_SIZES = {
  // ProductThumbnail: 모바일 ~350px, 데스크탑 ~670px
  productThumbnail: '(max-width: 1024px) 160px, 400px',
  // MainImage: 상세페이지 전체 너비
  mainImage: '100vw',
  // SubImages: 4열 그리드
  subImages: '(max-width: 1024px) 25vw, 200px',
  // 작은 썸네일: 128px 고정
  smallThumbnail: '128px',
  // 아주 작은 썸네일: 64px 이하
  tinyThumbnail: '64px',
} as const

/**
 * Next.js Image 컴포넌트용 커스텀 로더
 * 요청된 width에 따라 적절한 리사이즈 URL 반환
 */
export function imageLoader({ src, width }: { src: string; width: number }): string {
  const size: ImageSize = width <= 150 ? 150 : width <= 400 ? 400 : 800
  return toResizedWebpUrl(src, size)
}
