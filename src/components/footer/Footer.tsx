import Logo from '../Logo'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'

function Footer() {
  return (
    <footer className="border-border bg-light border-t">
      <div className="px-lg mx-auto max-w-7xl py-12">
        <div className="flex flex-wrap justify-baseline gap-x-10 gap-y-5 md:justify-between md:gap-0">
          <div className="flex flex-col gap-2">
            <Logo logoClassname="h-12" textClassname="text-gray-400" />
            <p className="text-gray-500">반려동물과 함께하는 행복한 반려동물 용품 거래를 경험하세요.</p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-gray-500">커뮤니티</h4>
            <ul className="flex flex-col gap-3 text-gray-500">
              <li>
                <Link href={`${ROUTES.COMMUNITY}?tab=tab-info`}>정보 공유해요</Link>
              </li>
              <li>
                <Link href={`${ROUTES.COMMUNITY}?tab=tab-question`}>질문 있어요</Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-gray-500">고객센터</h4>
            <ul className="flex flex-col gap-3 text-gray-500">
              <li>
                <a href="mailto:support@cuddlemarket.com?subject=허들마켓 1:1 문의">1:1 문의</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-300 pt-6">
          <p className="text-center text-gray-500">© 2025 커들마켓. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
