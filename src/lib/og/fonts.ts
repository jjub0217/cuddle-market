import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let fontData: ArrayBuffer | null = null

export async function getKoreanFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData

  // 굵기 700 으로 고정한 글꼴이어야 한다. 굵기를 조절할 수 있는 가변 글꼴(fvar 표)을 넣으면
  // ImageResponse 가 글꼴을 읽다가 실패해 미리보기 이미지가 전부 500 이 된다(#1118).
  const fontPath = join(process.cwd(), 'public', 'assets', 'fonts', 'NotoSansKR-Subset.ttf')
  const buffer = await readFile(fontPath)
  fontData = Uint8Array.from(buffer).buffer

  return fontData
}
