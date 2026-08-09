import { cn } from '@/lib/utils/cn'

// 알림이 하나도 없을 때 보이는 화면.
//
// 왜 조각으로 빼나: 모바일 오버레이·데스크탑 드롭다운·알림 페이지 셋이 같은 문구를
// 각자 들고 있었다. 문구를 고치려면 세 군데를 고쳐야 하고, 한 군데를 빠뜨리면 갈린다.
//
// 문구와 생김새는 앱(mobile/components/list-states.tsx의 EmptyState)에서 가져왔다.
// 웹이 「표시할 알림이 없습니다.」 한 줄이었는데, 웹·앱의 문구는 같아야 한다는 것이
// 이 바퀴의 기준이라 둘 중 하나로 모았다. 앱 쪽을 택한 이유는 앱의 다른 빈 화면
// (「아직 등록된 상품이 없어요.」)과 말투가 이미 같아서다.

interface NotificationsEmptyProps {
  /**
   * 부르는 쪽마다 높이가 다르다 (오버레이·드롭다운 min-h-32 / 페이지 h-64).
   *
   * ⚠️ **h-* 가 아니라 min-h-* 로 준다.** 안의 내용이 172px 인데 h-32(128)로 못 박으면
   *    justify-center 때문에 넘치는 44px 이 위아래로 22px 씩 삐져나가고,
   *    위로 나간 만큼이 부모의 overflow-y-auto 에 잘린다 —
   *    발자국 위 여백(py-6 = 24px)이 4px 만 남아 구분선에 붙어 보였다(#869 실측).
   */
  className?: string
}

export default function NotificationsEmpty({ className }: NotificationsEmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-6', className)}>
      <span className="mb-1 text-[40px] leading-none" aria-hidden="true">
        🐾
      </span>
      <p className="text-base font-semibold text-gray-700">아직 받은 알림이 없어요.</p>
      <p className="text-center text-[13px] text-gray-400">
        찜한 상품이나 내 글에 소식이 생기면 여기에 보여드릴게요.
      </p>
    </div>
  )
}
