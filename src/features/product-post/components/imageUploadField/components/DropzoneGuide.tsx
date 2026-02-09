import { FileUp } from 'lucide-react'

interface DropzoneGuideProps {
  maxFiles?: number
}

export default function DropzoneGuide({ maxFiles = 5 }: DropzoneGuideProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <FileUp size={30} strokeWidth={1.5} className="text-gray-400" />
      <div className="flex flex-col items-center text-sm text-gray-400">
        <p>파일을 드래그하거나 클릭하여 업로드</p>
        <p>최대 {maxFiles}개 파일, 각 5MB 이하</p>
      </div>
    </div>
  )
}
