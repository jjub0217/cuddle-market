type ImageSize = 150 | 400 | 800

// Placeholder 이미지 (크기별) - Next.js public 폴더 기준
export const PLACEHOLDER_IMAGES = {
  150: '/images/placeholder-150.webp',
  400: '/images/placeholder-400.webp',
  800: '/images/placeholder-800.webp',
} as const

/**
 * Placeholder srcset 생성
 */
export const PLACEHOLDER_SRCSET = `${PLACEHOLDER_IMAGES[150]} 150w, ${PLACEHOLDER_IMAGES[400]} 400w, ${PLACEHOLDER_IMAGES[800]} 800w`

/**
 * 원본 이미지 URL을 리사이즈된 WebP URL로 변환
 * @param originalUrl - API에서 받은 원본 이미지 URL (예: https://.../uuid.jpg)
 * @param size - 원하는 크기 (150 | 400 | 800)
 * @returns 리사이즈된 WebP URL (예: https://.../uuid_150.webp)
 */
export function toResizedWebpUrl(originalUrl: string | null | undefined, size: ImageSize): string {
  if (!originalUrl) return ''
  const lastDotIndex = originalUrl.lastIndexOf('.')
  if (lastDotIndex === -1) return `${originalUrl}_${size}.webp`
  return `${originalUrl.substring(0, lastDotIndex)}_${size}.webp`
}

/**
 * srcset용 이미지 URL 세트 생성
 * @param originalUrl - API에서 받은 원본 이미지 URL
 * @returns srcset 문자열 (예: "url_150.webp 150w, url_400.webp 400w, url_800.webp 800w")
 */
const SIZES: ImageSize[] = [150, 400, 800]
export function getImageSrcSet(originalUrl: string | null | undefined): string {
  if (!originalUrl) return ''
  return SIZES.map((size) => `${toResizedWebpUrl(originalUrl, size)} ${size}w`).join(', ')
}

/**
 * 사전 정의된 sizes 값
 */
export const IMAGE_SIZES = {
  productThumbnail: '(max-width: 1024px) 160px, 400px',
  mainImage: '100vw',
  subImages: '(max-width: 1024px) 25vw, 200px',
  smallThumbnail: '128px',
  tinyThumbnail: '64px',
} as const
