import { useRef } from 'react'

/**
 * 마크다운 편집 명령어를 제공하는 커스텀 훅
 * @param onChange - textarea 값이 변경될 때 호출되는 콜백
 */
export function useMdCommands(onChange: (value: string) => void) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /**
   * #1. 공통 헬퍼 함수
   * - textarea 참조를 안전하게 얻고
   * - 전달받은 동작 실행 → onChange 호출 → 포커스 유지
   */
  const withTextarea = (action: (textarea: HTMLTextAreaElement) => void) => {
    const textarea = textareaRef.current
    if (!textarea) return

    action(textarea)
    onChange(textarea.value)
    textarea.focus()
  }

  /**
   * #2. 인라인 토큰 감싸기 (굵게/기울임/코드)
   * 선택된 텍스트를 prefix와 suffix로 감쌉니다.
   *
   * @param prefix - 앞에 붙는 문자 (예: '**', '_', '`')
   * @param suffix - 뒤에 붙는 문자 (기본값: prefix와 동일)
   *
   * 예시:
   * - wrapSelectedText('**')  → "텍스트" → "**텍스트**" (굵게)
   * - wrapSelectedText('_')   → "텍스트" → "_텍스트_"   (기울임)
   * - wrapSelectedText('`')   → "텍스트" → "`텍스트`"   (인라인 코드)
   */
  const wrapSelectedText = (prefix: string, suffix: string = prefix) =>
    withTextarea((textarea) => {
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const fullText = textarea.value

      const selectedText = fullText.slice(selectionStart, selectionEnd)
      const wrappedText = `${prefix}${selectedText}${suffix}`

      textarea.setRangeText(wrappedText, selectionStart, selectionEnd, 'end')
    })

  /**
   * #3. 링크 삽입
   * - 텍스트가 선택되어 있으면: 선택된 텍스트를 URL로 사용
   * - 선택이 없으면: 커서 주변 단어(공백으로 구분)를 URL로 사용
   * - 둘 다 없으면: 빈 링크 [Link]() 삽입
   */
  const insertLink = () =>
    withTextarea((textarea) => {
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const fullText = textarea.value

      const createLink = (url: string) => `[Link](${url})`

      // Case 1: 텍스트가 선택되어 있으면 그걸 URL로 사용
      const hasSelection = selectionStart !== selectionEnd
      if (hasSelection) {
        const selectedUrl = fullText.slice(selectionStart, selectionEnd).trim()
        textarea.setRangeText(
          createLink(selectedUrl),
          selectionStart,
          selectionEnd,
          'end'
        )
        return
      }

      // Case 2: 선택이 없으면 커서 주변 단어를 찾음
      const isWhitespace = (char: string) => /\s/.test(char)

      // 왼쪽으로 이동하며 단어 시작점 찾기
      let wordStart = selectionStart
      while (wordStart > 0 && !isWhitespace(fullText[wordStart - 1])) {
        wordStart--
      }

      // 오른쪽으로 이동하며 단어 끝점 찾기
      let wordEnd = selectionEnd
      while (wordEnd < fullText.length && !isWhitespace(fullText[wordEnd])) {
        wordEnd++
      }

      const wordUnderCursor = fullText.slice(wordStart, wordEnd).trim()

      if (wordUnderCursor) {
        // 커서 주변에 단어가 있으면 그걸 URL로 사용
        textarea.setSelectionRange(wordStart, wordEnd)
        textarea.setRangeText(
          createLink(wordUnderCursor),
          wordStart,
          wordEnd,
          'end'
        )
      } else {
        // Case 3: 아무것도 없으면 빈 링크 삽입
        textarea.setRangeText('[Link]()', selectionStart, selectionEnd, 'end')
      }
    })

  /**
   * #4. 줄 prefix 토글 (제목, 리스트 등)
   * - 선택된 줄들의 앞에 prefix를 붙이거나, 이미 있으면 제거합니다.
   * - 여러 줄 선택 시 각 줄에 동일 규칙을 적용합니다.
   *
   * @param prefix - 줄 앞에 붙일 문자 (예: '# ', '- ', '1. ')
   * @param removePattern - prefix 제거에 사용할 정규식 (선택적)
   */
  const toggleLinePrefix = (prefix: string, removePattern?: RegExp) =>
    withTextarea((textarea) => {
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const fullText = textarea.value

      // 선택된 영역이 포함된 줄들의 시작과 끝 찾기
      const blockStart = fullText.lastIndexOf('\n', selectionStart - 1) + 1
      const nextNewline = fullText.indexOf('\n', selectionEnd)
      const blockEnd =
        selectionEnd === fullText.length
          ? selectionEnd
          : nextNewline === -1
            ? fullText.length
            : nextNewline

      // 선택된 블록을 줄 단위로 나누기
      const selectedBlock = fullText.slice(blockStart, blockEnd)
      const lines = selectedBlock.split('\n')

      // prefix를 정규식 특수문자 이스케이프하여 패턴 생성
      const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = removePattern ?? new RegExp(`^${escapeRegex(prefix)}`)

      // 모든 줄에 이미 prefix가 있는지 확인
      const allLinesHavePrefix = lines.every((line) => pattern.test(line))

      // 토글: 모두 있으면 제거, 하나라도 없으면 추가
      const newLines = lines.map((line) => {
        if (allLinesHavePrefix) {
          return line.replace(pattern, '') // prefix 제거
        } else {
          return line ? `${prefix}${line}` : prefix // prefix 추가
        }
      })

      const newBlock = newLines.join('\n')
      textarea.setRangeText(newBlock, blockStart, blockEnd, 'end')
    })

  /**
   * 제목(H1) 토글: "# " prefix
   * 예시: "제목" ↔ "# 제목"
   */
  const toggleH1 = () => toggleLinePrefix('# ', /^#\s+/)

  /**
   * 순서 없는 리스트 토글: "- " prefix
   * 예시: "항목" ↔ "- 항목"
   */
  const toggleUl = () => toggleLinePrefix('- ', /^-\s+/)

  /**
   * 순서 있는 리스트 토글: "1. " prefix
   * 예시: "항목" ↔ "1. 항목"
   */
  const toggleOl = () => toggleLinePrefix('1. ', /^\d+\.\s+/)

  /**
   * 이미지 삽입
   * @param url - 이미지 URL
   * @param alt - 대체 텍스트 (기본값: 'image')
   *
   * 결과: ![image](url)
   */
  const insertImage = (url: string, alt: string = 'image') =>
    withTextarea((textarea) => {
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd

      const markdownImage = `![${alt}](${url})`
      textarea.setRangeText(markdownImage, selectionStart, selectionEnd, 'end')
    })

  return {
    textareaRef,
    wrapSelectedText,
    insertLink,
    toggleH1,
    toggleUl,
    toggleOl,
    insertImage,
  }
}
