import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

// 계정 삭제 안내. Play Console 「데이터 보안」에 이 주소를 등록한다.
//
// 왜 방침 페이지(/privacy)로 갈음하지 않았나:
// 구글은 앱에서 계정을 만들 수 있으면 「앱 안 경로」와 「웹 경로」 둘 다를 요구하고,
// 웹 경로는 "사용자를 다시 앱으로 돌려보내지 않고" 요청할 수 있어야 한다고 못박는다.
// 방침 4장은 「마이페이지에서 하실 수 있습니다」로 끝나서 앱을 지운 사람에겐 길이 없다.
// 기존 방침에 앵커를 걸어 쓰는 것도 인정되지만, 심사자가 긴 방침의 4장을
// "도드라진다"고 볼지 확실하지 않아 전용 페이지로 만든다.
//
// 지우는 항목·기간은 /privacy 3·4장과 같은 내용이다. 한쪽만 고치면 어긋나므로
// 문구를 바꿀 때는 반드시 둘을 같이 고칠 것.

export const metadata: Metadata = {
  title: '계정 삭제 | 커들마켓',
  description: '커들마켓 계정과 관련 데이터를 삭제하는 방법을 안내합니다.',
  alternates: {
    canonical: '/account-deletion',
  },
  robots: { index: true, follow: true },
}

const CONTACT_EMAIL = 'devel.jjub@gmail.com'

/** 처리 소요. 실제 운영에 맞춰 바꿀 것. */
const PROCESSING_DAYS = '영업일 기준 3일'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  )
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function AccountDeletionPage() {
  return (
    // max-w-3xl 같은 티셔츠 크기는 이 프로젝트에서 쓰면 안 된다.
    // Tailwind v4가 tokens.spacing.css의 --spacing-3xl(48px)로 풀어버려 폭이 48px이 된다.
    // 숫자 방식(max-w-170 = 680px)을 따른다. /privacy와 같은 폭이다.
    <div className="mx-auto w-full max-w-170 px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">커들마켓 계정 삭제</h1>
      <p className="mb-8 text-sm text-gray-500">
        앱 이름: 커들마켓 · 개발자: 커들마켓 (Cuddle Market)
      </p>

      <p className="mb-10 text-sm leading-relaxed text-gray-700">
        커들마켓 계정과 계정에 딸린 개인정보를 지우는 방법을 안내합니다. 두 가지 길이 있으며, 앱을
        이미 지우셨거나 로그인할 수 없더라도 아래 <strong>「앱을 쓸 수 없을 때」</strong> 방법으로
        요청하실 수 있습니다.
      </p>

      <div className="space-y-10">
        <Section title="1. 앱에서 직접 지우기">
          <p>커들마켓 앱에 로그인하신 상태라면 앱 안에서 바로 지울 수 있습니다.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>커들마켓 앱을 엽니다.</li>
            <li>하단의 「마이」 탭으로 이동합니다.</li>
            <li>「회원 탈퇴」를 누릅니다.</li>
            <li>사유를 고르고 안내에 따라 확인하면 즉시 처리됩니다.</li>
          </ol>
          <p>웹사이트(cuddle-market.vercel.app)의 마이페이지에서도 같은 방법으로 하실 수 있습니다.</p>
        </Section>

        <Section title="2. 앱을 쓸 수 없을 때 — 이메일로 요청">
          <p>
            앱을 이미 지우셨거나 비밀번호를 잊는 등으로 로그인할 수 없다면, 아래 주소로 삭제를
            요청해 주세요.
          </p>

          <p className="rounded-2xl bg-gray-50 p-5">
            <a href={`mailto:${CONTACT_EMAIL}?subject=커들마켓 계정 삭제 요청`} className="font-medium text-gray-900 underline">
              {CONTACT_EMAIL}
            </a>
          </p>

          <p>본인 확인을 위해 메일에 아래 내용을 함께 적어 주세요.</p>
          <List
            items={[
              '가입하실 때 쓰신 이메일 주소',
              '닉네임 (기억나시면)',
              '제목에 「계정 삭제 요청」이라고 적어 주시면 빠르게 확인할 수 있습니다.',
            ]}
          />
          <p>
            요청을 받으면 본인 확인 후 <strong>{PROCESSING_DAYS}</strong> 안에 처리하고, 처리 결과를
            같은 주소로 알려드립니다.
          </p>
        </Section>

        <Section title="3. 무엇이 지워지나요">
          <p>탈퇴하면 회원을 알아볼 수 있는 정보를 즉시 지웁니다.</p>
          <List
            items={[
              '이메일 주소 · 비밀번호',
              '이름 · 닉네임 · 생년월일',
              '사는 지역 (시/도, 구/군)',
              '프로필 사진 · 소개글',
            ]}
          />
          <p>전자 파일 형태는 되살릴 수 없는 방법으로 지웁니다.</p>
        </Section>

        <Section title="4. 무엇이 남나요">
          <p>
            아래는 법에서 정한 기간 동안 따로 보관합니다. 이 기간이 지나면 파기하며, 그동안에는 다른
            개인정보와 분리해 보관합니다.
          </p>
          <List
            items={[
              '소비자 불만·분쟁 처리 기록 — 3년 (전자상거래법)',
              '접속 기록 — 3개월 (통신비밀보호법)',
            ]}
          />
          <p>
            탈퇴 사유는 누구인지 알 수 없는 형태로만 남겨 서비스 개선을 위한 통계에 씁니다.
          </p>
        </Section>

        <Section title="5. 더 자세한 내용">
          <p>
            개인정보를 어떻게 모으고 쓰고 지우는지는{' '}
            <Link href="/privacy" className="text-gray-900 underline">
              개인정보처리방침
            </Link>
            에서 보실 수 있습니다.
          </p>
        </Section>
      </div>
    </div>
  )
}
