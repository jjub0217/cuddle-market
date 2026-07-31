import Logo from '../Logo'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="hidden border-border bg-light border-t md:block">
      <div className="px-lg mx-auto max-w-7xl py-12">
        <div className="flex flex-wrap justify-baseline gap-x-10 gap-y-5 md:justify-between md:gap-0">
          <div className="flex flex-col gap-2">
            <Logo logoClassname="h-12" />
            <p className="text-sm text-gray-500">반려동물과 함께하는 행복한 반려동물 용품 거래를 경험하세요.</p>
          </div>

          <nav aria-label="푸터 링크" className="flex flex-wrap gap-x-10 gap-y-5">
            <div className="flex flex-col gap-4">
              <strong className="font-semibold text-gray-500">커뮤니티</strong>
              <ul className="flex flex-col gap-2 text-sm text-gray-500">
                <li>
                  <Link href={`${ROUTES.COMMUNITY}?tab=tab-info`}>정보 공유해요</Link>
                </li>
                <li>
                  <Link href={`${ROUTES.COMMUNITY}?tab=tab-question`}>질문 있어요</Link>
                </li>
              </ul>
            </div>

            {/* 안내 문서는 여기 나란히 둔다. 아직 넷 이하라 목차 페이지를 두면
                한 번 더 눌러야 닿는다.

                ⚠️ 항목이 다섯을 넘어가면 그때 「도움말 센터」(/help) 목차 페이지를
                만들고 이 문서들을 그 하위로 옮긴다. 앞으로 생길 만한 것들:
                이용약관 · 운영정책(금지 행위·제재 기준) · 안전거래 안내 ·
                자주 묻는 질문 · 공지사항 · 청소년보호정책.
                미리 목차부터 만들지는 않는다 — 아직 오지 않은 문제다. */}
            <div className="flex flex-col gap-4">
              <strong className="font-semibold text-gray-500">고객센터</strong>
              <ul className="flex flex-col gap-2 text-sm text-gray-500">
                <li>
                  <a href="mailto:devel.jjub@gmail.com?subject=커들마켓 1:1 문의" aria-label="고객센터 이메일로 1:1 문의하기">
                    1:1 문의
                  </a>
                </li>
                <li>
                  <Link href={ROUTES.PRIVACY}>개인정보처리방침</Link>
                </li>
                <li>
                  <Link href={ROUTES.ACCOUNT_DELETION}>계정 삭제 안내</Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-300 pt-6">
          <p className="text-center text-sm text-gray-500">© 2026 커들마켓. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
