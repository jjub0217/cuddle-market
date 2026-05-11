import IconButton from '@/components/commons/button/IconButton'
import { Bold, Italic, Code2, Link as LinkIcon, List, Image as ImageTool } from 'lucide-react'

interface MdToolbarProps {
  onBold: () => void
  onItalic: () => void
  onCode: () => void
  onLink: () => void
  onH1: () => void
  onBullet: () => void
  onNumber: () => void
  onImage: () => void
}

export default function MdToolbar({ onBold, onItalic, onCode, onLink, onH1, onBullet, onNumber, onImage }: MdToolbarProps) {
  return (
    <div className="bg-surface-container-low flex flex-wrap items-center justify-end gap-1 rounded-2xl px-2 py-2">
      <IconButton aria-label="굵게" onClick={onBold} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <Bold size={16} />
      </IconButton>
      <IconButton aria-label="기울임" onClick={onItalic} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <Italic size={16} />
      </IconButton>
      <IconButton aria-label="코드" onClick={onCode} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <Code2 size={16} />
      </IconButton>
      <IconButton aria-label="링크" onClick={onLink} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <LinkIcon size={16} />
      </IconButton>
      <IconButton aria-label="제목" onClick={onH1} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <span>
          <span>H</span>
          <span className="text-xs">1</span>
        </span>
      </IconButton>
      <IconButton aria-label="목록" onClick={(e) => (e.shiftKey ? onNumber() : onBullet())} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <List size={16} />
      </IconButton>
      <IconButton aria-label="이미지" onClick={onImage} className="hover:bg-surface-container-lowest hover:text-primary-container transition-colors">
        <ImageTool size={16} />
      </IconButton>
    </div>
  )
}
