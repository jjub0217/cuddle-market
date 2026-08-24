'use client'

import { useRef, type DragEvent, type ClipboardEvent, type ChangeEvent } from 'react'
import { useMdCommands } from './useMdCommands'
import { useMdImageUpload } from './useMdImageUpload'
import MdToolbar from './MdToolbar'
import dynamic from 'next/dynamic'

const MdPreview = dynamic(() => import('./MdPreview'), {
  ssr: false,
  loading: () => <div className="p-3 text-sm text-gray-400">로딩 중...</div>,
})
interface MarkDownProps {
  value: string // 현재 마크다운 텍스트
  onChange: (value: string) => void // 텍스트 변경 콜백
  placeholder?: string // 빈 상태일 때 표시할 텍스트
  height?: number // textarea 높이 (픽셀)
  tab: 'edit' | 'preview' // 외부 제어 탭 상태
}

const DEFAULT_PLACEHOLDER = '내용을 입력하세요'

export default function Markdown({ value, onChange, placeholder = DEFAULT_PLACEHOLDER, height = 282, tab }: MarkDownProps) {
  // ==========================================
  // 1. 마크다운 편집 명령어 훅
  // ==========================================

  const {
    textareaRef, // textarea DOM 참조
    wrapSelectedText, // 선택 텍스트 감싸기 (굵게, 기울임, 코드)
    insertLink, // 링크 삽입
    toggleH1, // 제목 토글
    toggleUl, // 순서 없는 리스트 토글
    toggleOl, // 순서 있는 리스트 토글
  } = useMdCommands(onChange)

  // ==========================================
  // 2-1. 이미지 업로드 훅
  // ==========================================

  const { upload, isUploading } = useMdImageUpload({
    onError: (message) => alert(message),
  })

  // 이미지 파일을 마크다운 문법으로 삽입
  const insertImage = async (file: File) => {
    const url = await upload(file)
    if (url) {
      const imageMarkdown = `![이미지](${url})\n`
      onChange(value + imageMarkdown)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDrop = async (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      await insertImage(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
  }

  // 이미지 복사 붙여넣기 핸들러
  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData.files[0]
    if (file && file.type.startsWith('image/')) {
      e.preventDefault()
      await insertImage(file)
    }
  }

  // 파일 선택 input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 툴바 이미지 버튼 클릭 핸들러
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  // 파일 선택 핸들러
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await insertImage(file)
      e.target.value = '' // 같은 파일 재선택 가능하도록 초기화
    }
  }

  // ==========================================
  // 3. 렌더링
  // ==========================================

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        {/* 툴바: 편집/미리보기 탭 + 서식 버튼들 */}
        <MdToolbar
          onBold={() => wrapSelectedText('**')} // **텍스트** (굵게)
          onItalic={() => wrapSelectedText('*')} // *텍스트*  (기울임)
          onCode={() => wrapSelectedText('`')} // `텍스트`  (코드)
          onLink={insertLink} // [Link](url)
          onH1={toggleH1} // # 제목
          onBullet={toggleUl} // - 리스트
          onNumber={toggleOl} // 1. 리스트
          onImage={handleImageButtonClick} // 이미지 업로드
        />

        {/* 숨겨진 파일 선택 input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* 편집/미리보기 컨테이너 — 고정 높이로 탭 전환 시 흔들림 방지 */}
        <div style={{ height }} className="relative bg-white">
          {tab === 'edit' ? (
            <>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onPaste={handlePaste}
                placeholder={placeholder}
                className="absolute inset-0 box-border h-full w-full resize-none bg-white p-3"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="text-sm text-gray-500">이미지 업로드 중...</span>
                </div>
              ) : null}
            </>
          ) : (
            <MdPreview value={value} className="absolute inset-0" />
          )}
        </div>

      </div>
    </div>
  )
}
