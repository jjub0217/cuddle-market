import Image from 'next/image'

interface ImageCellProps {
  value: string
}

export default function ImageCell({ value }: ImageCellProps) {
  return (
    <div className="flex items-center justify-center">
      <Image
        src={value}
        alt=""
        width={40}
        height={40}
        className="rounded-md object-cover"
        unoptimized
      />
    </div>
  )
}
