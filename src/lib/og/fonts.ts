import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let fontData: ArrayBuffer | null = null

export async function getKoreanFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData

  const fontPath = join(process.cwd(), 'public', 'assets', 'fonts', 'NotoSansKR-Subset.ttf')
  const buffer = await readFile(fontPath)
  fontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  return fontData
}
