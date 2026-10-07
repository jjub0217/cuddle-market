import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// 글꼴 파일 앞머리의 표 목록을 읽는다 (12바이트 머리말 뒤로 16바이트씩).
async function readTableTags(path: string): Promise<string[]> {
  const buffer = await readFile(path)
  const numTables = buffer.readUInt16BE(4)
  return Array.from({ length: numTables }, (_, i) => buffer.toString('latin1', 12 + 16 * i, 16 + 16 * i))
}

describe('미리보기 이미지용 한글 글꼴', () => {
  it('굵기가 고정된 글꼴이다 (가변 글꼴이면 ImageResponse 가 500 을 낸다)', async () => {
    const tags = await readTableTags(join(process.cwd(), 'public', 'assets', 'fonts', 'NotoSansKR-Subset.ttf'))

    expect(tags).toContain('glyf')
    expect(tags).not.toContain('fvar')
  })
})
