import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

// 이용약관.
//
// 왜 필요한가 (전자상거래법 제10조 제1항):
// 사이버몰 운영자는 상호·대표자 성명·주소·전화번호·전자우편주소·사업자등록번호와
// **이용약관**을 초기화면에 표시해야 한다. 2025년 3월 당근마켓이 이 조항과
// 제20조 제1·2항을 어겨 시정명령과 과태료 100만원을 받았다. 같은 형태의
// 중고거래 중개 서비스라 커들마켓에도 그대로 적용된다.
//
// ⚠️ 이 문서는 **법률 자문이 아니라 뼈대**다. 실제로 공표하기 전에 아래를 채워야 한다.
// TODO(사람): 사업자 정보(상호·대표자·영업소 주소·전화번호·사업자등록번호)를 정하고
//             제20조에 적는다. 사업자등록 자체를 할 것인지부터 결정해야 한다.
//             지금은 없어서 안 적었다 — 없는 값을 지어내면 그것이 더 큰 문제가 된다.
// TODO(사람): 변호사 또는 공정거래위원회 상담을 거쳐 확정한다.
//
// 구조는 /privacy 와 같다(Section · Row · List · max-w-170 · 목차).
// 셋째 법·정책 문서라 이 세 컴포넌트가 세 번째로 복사됐다. 공유 파일로 빼는 것은
// 이 이슈의 범위가 아니라 따로 정리한다.

export const metadata: Metadata = {
  title: '이용약관 | 커들마켓',
  description: '커들마켓 서비스를 이용할 때 적용되는 약관입니다.',
  alternates: {
    canonical: '/terms',
  },
  robots: { index: true, follow: true },
}

// TODO(사람): 실제 공표하는 날로 바꾼다. 최초 제정이라 사전 공지 기간은 없다.
const EFFECTIVE_DATE = '2026년 9월 1일'

const CONTACT_EMAIL = 'devel.jjub@gmail.com'

/** 약관의 한 조(條). 목차에서 이동할 수 있도록 id를 단다. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-200 pt-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  )
}

/**
 * 라벨 + 설명 한 줄.
 * 표(<table>)를 쓰지 않는 이유: 모바일 폭에서 가로 스크롤이 생긴다.
 * 좁은 화면에서는 위아래로, 넓은 화면에서는 좌우로 놓인다.
 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 font-medium text-gray-900 sm:w-44">{label}</dt>
      <dd className="text-gray-600">{children}</dd>
    </div>
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

const TOC = [
  ['purpose', '제1조 목적'],
  ['definitions', '제2조 용어의 뜻'],
  ['amendment', '제3조 약관의 게시와 개정'],
  ['contract', '제4조 이용계약의 성립'],
  ['account', '제5조 계정 관리'],
  ['service', '제6조 서비스의 제공과 중단'],
  ['broker', '제7조 커들마켓의 지위 — 거래 당사자가 아닙니다'],
  ['safe-trade', '제8조 안전한 거래를 위한 부탁'],
  ['banned-items', '제9조 올릴 수 없는 물건'],
  ['banned-acts', '제10조 하면 안 되는 행동'],
  ['posts', '제11조 게시물의 관리'],
  ['copyright', '제12조 게시물의 저작권'],
  ['restriction', '제13조 이용 제한'],
  ['withdrawal', '제14조 이용계약의 해지'],
  ['privacy', '제15조 개인정보의 보호'],
  ['liability', '제16조 책임의 한계'],
  ['shutdown', '제17조 서비스의 종료'],
  ['dispute', '제18조 분쟁의 해결'],
  ['law', '제19조 준거법과 재판 관할'],
  ['operator', '제20조 운영자 정보와 문의처'],
] as const

export default function TermsPage() {
  return (
    // max-w-3xl 같은 티셔츠 크기는 이 프로젝트에서 쓰면 안 된다.
    // Tailwind v4가 tokens.spacing.css의 --spacing-3xl(48px)로 풀어버려 폭이 48px이 된다.
    // 숫자 방식(max-w-170 = 680px)을 따른다. /privacy와 같은 폭이다.
    <div className="mx-auto w-full max-w-170 px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">이용약관</h1>
      <p className="mb-8 text-sm text-gray-500">시행일: {EFFECTIVE_DATE}</p>

      <p className="mb-10 text-sm leading-relaxed text-gray-700">
        커들마켓(이하 &lsquo;서비스&rsquo;)을 쓸 때 서비스와 이용자 사이에 무엇을 지켜야 하는지를 정한
        문서입니다. 서비스는 이용자끼리 반려동물 용품을 사고팔 수 있도록 자리를 마련하는 곳이며,{' '}
        <strong className="font-medium text-gray-900">거래의 당사자가 아닙니다.</strong> 자세한 내용은
        제7조에서 밝힙니다.
      </p>

      <nav aria-label="목차" className="mb-10 rounded-2xl bg-gray-50 p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-900">목차</h2>
        <ul className="space-y-1 text-sm">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-gray-600 hover:text-gray-900 hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        <Section id="purpose" title="제1조 (목적)">
          <p>
            이 약관은 커들마켓이 웹사이트와 앱으로 제공하는 서비스를 이용할 때, 서비스와 이용자 사이의
            권리와 의무, 그리고 책임이 어디까지인지를 정하기 위한 것입니다.
          </p>
        </Section>

        <Section id="definitions" title="제2조 (용어의 뜻)">
          <p>이 약관에서 쓰는 말의 뜻은 다음과 같습니다.</p>
          <dl>
            <Row label="서비스">
              커들마켓이 웹사이트와 앱으로 제공하는 반려동물 용품 중고거래와 커뮤니티 서비스
            </Row>
            <Row label="이용자">회원과 비회원을 모두 이르는 말</Row>
            <Row label="회원">가입해 계정을 가진 사람</Row>
            <Row label="게시물">
              상품글, 커뮤니티 글과 댓글, 채팅 메시지, 사진 등 이용자가 서비스에 올린 모든 것
            </Row>
            <Row label="중개">
              이용자끼리 거래할 수 있도록 자리와 도구(글 등록·검색·채팅)를 마련해 주는 일
            </Row>
          </dl>
          <p>여기서 정하지 않은 말은 관계 법령과 일반적인 상거래 관행에 따릅니다.</p>
        </Section>

        <Section id="amendment" title="제3조 (약관의 게시와 개정)">
          <List
            items={[
              '이 약관은 서비스 첫 화면에서 링크로 볼 수 있도록 올려 둡니다.',
              '서비스는 관련 법을 어기지 않는 범위에서 이 약관을 고칠 수 있습니다.',
              '고칠 때에는 바뀌는 내용과 시행일을 시행 7일 전부터 서비스 안에 알립니다. 이용자에게 불리하게 바뀌는 경우에는 30일 전에 알리며, 바뀐 부분을 견주어 볼 수 있도록 함께 안내합니다.',
              '바뀐 약관에 동의하지 않으시면 언제든 탈퇴하실 수 있습니다.',
              '알린 기간이 지나도록 아무 말씀이 없고 서비스를 계속 쓰시면 바뀐 약관에 동의하신 것으로 봅니다. 다만 그 기간 안에 동의하지 않는다고 알려 주시면 그렇지 않습니다.',
            ]}
          />
        </Section>

        <Section id="contract" title="제4조 (이용계약의 성립)">
          <List
            items={[
              '가입을 신청하고 서비스가 이를 받아들이면 이용계약이 맺어집니다.',
              '가입하실 때 이 약관에 동의하신 것으로 봅니다.',
              '만 14세 미만은 가입하실 수 없습니다.',
            ]}
          />
          <p>다음에 해당하면 가입을 받지 않거나 나중으로 미룰 수 있습니다.</p>
          <List
            items={[
              '남의 정보를 쓰거나 사실과 다른 정보를 적은 경우',
              '앞서 이 약관을 어겨 이용이 영구히 제한된 적이 있는 경우',
              '서비스 설비에 여유가 없거나 기술적으로 어려운 경우',
              '그 밖에 법을 어기거나 다른 이용자에게 해를 끼칠 것이 분명한 경우',
            ]}
          />
        </Section>

        <Section id="account" title="제5조 (계정 관리)">
          <List
            items={[
              '적어 주신 정보가 바뀌면 고쳐 주세요. 고치지 않아 생긴 불이익은 서비스가 책임지지 않습니다.',
              '계정은 본인만 쓸 수 있습니다. 남에게 빌려주거나 넘기거나 팔 수 없습니다.',
              '계정이 도용된 것 같으면 곧바로 알려 주세요. 알려 주시면 서비스가 필요한 조치를 안내해 드립니다.',
            ]}
          />
        </Section>

        <Section id="service" title="제6조 (서비스의 제공과 중단)">
          <p>서비스는 다음을 제공합니다.</p>
          <List
            items={[
              '상품글 등록·검색·조회',
              '이용자끼리의 채팅',
              '커뮤니티 글과 댓글',
              '찜하기와 알림',
              '신고와 차단',
            ]}
          />
          <List
            items={[
              '서비스는 연중무휴 하루 24시간 제공하는 것을 원칙으로 합니다.',
              '설비 점검·교체, 고장, 통신 두절, 천재지변 등으로 잠시 멈출 수 있습니다. 이때는 미리 알려 드리며, 미리 알릴 수 없는 사정이면 벌어진 뒤에 알려 드립니다.',
              '제공하는 항목은 바뀔 수 있습니다. 서비스 자체를 그만두는 경우는 제17조를 따릅니다.',
            ]}
          />
        </Section>

        <Section id="broker" title="제7조 (커들마켓의 지위 — 거래 당사자가 아닙니다)">
          <p className="font-medium text-gray-900">
            커들마켓은 이용자끼리 거래할 자리를 마련하는 통신판매중개자이며, 거래의 당사자가 아닙니다.
          </p>
          <List
            items={[
              '상품의 정보와 거래 조건(가격·상태·주고받는 방법)은 파는 이용자가 정해 올립니다. 서비스는 그 내용이 사실인지 보증하지 않습니다.',
              '상품의 상태, 주고받는 과정, 대금, 환불처럼 거래에서 생기는 일은 거래한 이용자 사이의 책임입니다.',
              '서비스는 대금을 대신 받아 두거나 결제를 처리하지 않습니다.',
            ]}
          />
          <p>다만 서비스도 법이 정한 몫은 집니다.</p>
          <List
            items={[
              '서비스가 거래 당사자가 아니라는 사실을 미리 알리지 않아 이용자에게 재산상 손해가 생겼다면, 법에 따라 함께 배상할 책임을 집니다(전자상거래법 제20조의2 제1항).',
              '거래에서 불만이나 다툼이 생기면 원인과 피해를 파악하는 등 필요한 조치를 빠르게 합니다(같은 법 제20조 제3항).',
            ]}
          />
        </Section>

        <Section id="safe-trade" title="제8조 (안전한 거래를 위한 부탁)">
          <p>
            거래는 이용자끼리 하는 것이라 서비스가 대신 지켜 드릴 수 없습니다. 아래를 지키시면 사고를 크게
            줄일 수 있습니다.
          </p>
          <List
            items={[
              '직접 만나실 때에는 낮에, 사람이 많은 곳에서 만나세요.',
              '물건을 확인하기 전에 돈을 먼저 보내지 마세요.',
              '채팅은 서비스 안에서 하세요. 밖으로 옮기면 다툼이 생겼을 때 확인할 기록이 남지 않습니다.',
              '이상하다 싶으면 신고해 주세요. 사기로 의심되면 경찰청 사이버범죄 신고시스템(ecrm.police.go.kr)에도 알리실 수 있습니다.',
            ]}
          />
        </Section>

        <Section id="banned-items" title="제9조 (올릴 수 없는 물건)">
          <h3 className="pt-2 font-bold text-gray-900">살아 있는 동물</h3>
          <p>
            살아 있는 동물은 팔거나 분양하는 글을 올릴 수 없습니다. 무료 분양도 마찬가지입니다. 동물을 사서
            파는 일은 「동물보호법」상 허가를 받아야 하는 영업이고, 허가 없이 하면 2년 이하의 징역이나
            2천만원 이하의 벌금을 받을 수 있습니다. 서비스는 반려동물 <strong>용품</strong>을 주고받는
            곳입니다.
          </p>

          <h3 className="pt-4 font-bold text-gray-900">법으로 사고팔 수 없는 것</h3>
          <List
            items={[
              '마약류, 총포·도검·화약류',
              '법으로 잡거나 팔 수 없는 야생생물과 그 가공품',
              '처방이 필요한 동물용 의약품, 허가받지 않은 의약품',
              '가짜 상품(위조품)과 남의 상표를 붙인 물건',
              '다른 사람의 개인정보가 담긴 것',
              '음란물, 그 밖에 법으로 유통이 금지된 것',
            ]}
          />

          <h3 className="pt-4 font-bold text-gray-900">안전이 걱정되는 것</h3>
          <List
            items={[
              '유통기한이 지난 사료·간식',
              '뜯어서 쓴 뒤 다시 봉한 위생용품',
              '어디서 만들었는지 알 수 없어 안전을 확인할 수 없는 것',
            ]}
          />
          <p>그 밖에 서비스가 이용자 보호를 위해 따로 정해 알린 물건도 올릴 수 없습니다.</p>
        </Section>

        <Section id="banned-acts" title="제10조 (하면 안 되는 행동)">
          <List
            items={[
              '사실과 다른 정보를 올리거나, 남의 사진·글을 자기 것처럼 쓰는 행동',
              '물건을 보낼 뜻 없이 돈만 받는 등 남을 속이는 행동',
              '같은 글을 여러 번 올리거나, 거래와 상관없는 광고를 뿌리는 행동',
              '다른 서비스나 외부 결제로 옮겨 가도록 꾀는 행동',
              '욕설, 협박, 차별·혐오 표현, 성희롱',
              '음란물이나 청소년에게 해로운 것을 올리는 행동',
              '다른 이용자의 개인정보를 함부로 모으거나 밖에 알리는 행동',
              '자동화 프로그램으로 정보를 긁어 가거나 대량으로 글을 올리는 행동',
              '서비스의 설비나 프로그램을 망가뜨리거나 몰래 고치려는 행동',
              '남의 계정을 쓰거나, 계정을 사고파는 행동',
              '그 밖에 법을 어기거나 다른 이용자에게 해를 끼치는 행동',
            ]}
          />
        </Section>

        <Section id="posts" title="제11조 (게시물의 관리)">
          <List
            items={[
              '게시물이 제9조·제10조에 해당하면 서비스는 그 게시물을 감추거나 지울 수 있습니다.',
              '조치하기 전에 알려 드리는 것이 원칙입니다. 다만 그대로 두면 피해가 커질 것이 분명한 경우에는 먼저 조치하고 곧바로 알려 드립니다.',
              '자기 게시물이 명예훼손이나 저작권 침해에 해당한다고 알려 오시면, 법에 따라 30일 안의 기간을 정해 잠시 보이지 않게 할 수 있습니다(정보통신망법 제44조의2).',
              '조치가 부당하다고 보시면 제20조의 문의처로 이의를 알려 주세요. 확인해 잘못이 있으면 되돌립니다.',
            ]}
          />
        </Section>

        <Section id="copyright" title="제12조 (게시물의 저작권)">
          <List
            items={[
              '게시물의 저작권은 그것을 올린 이용자에게 있습니다.',
              '서비스는 게시물을 서비스 화면에 보여주고, 검색 결과에 싣고, 서비스를 알리는 데 필요한 범위에서만 무상으로 씁니다. 이 범위를 넘겨 쓰려면 따로 동의를 받습니다.',
              '탈퇴하시면 올리신 게시물은 개인정보처리방침에 따라 처리합니다.',
              '다만 다른 이용자와 주고받은 채팅 메시지처럼 상대방의 기록이기도 한 것은, 상대방 쪽에 남을 수 있습니다.',
            ]}
          />
        </Section>

        <Section id="restriction" title="제13조 (이용 제한)">
          <p>이 약관을 어기시면 서비스는 아래와 같이 이용을 제한할 수 있습니다.</p>
          <dl>
            <Row label="주의">가벼운 위반이거나 처음인 경우, 무엇이 문제인지 알려 드립니다</Row>
            <Row label="게시물 삭제">해당 게시물만 감추거나 지웁니다</Row>
            <Row label="기간을 정한 이용 제한">
              주의를 드렸는데도 되풀이하거나, 다른 이용자에게 피해를 준 경우
            </Row>
            <Row label="영구 이용 제한">
              사기, 제9조의 법으로 금지된 물건 판매, 성착취물 유포처럼 무거운 경우이거나, 기간을 정한 제한
              뒤에도 되풀이하는 경우
            </Row>
          </dl>
          <List
            items={[
              '제한하기 전에 무엇을 어겼는지 알려 드리고 해명하실 기회를 드립니다. 다만 피해가 커질 것이 분명한 경우에는 먼저 제한하고 곧바로 알려 드립니다.',
              '제한이 부당하다고 보시면 알려 드린 날부터 30일 안에 제20조의 문의처로 이의를 알려 주세요.',
              '이용이 제한되어도 이미 맺어진 거래에 대한 이용자의 책임은 그대로입니다.',
            ]}
          />
        </Section>

        <Section id="withdrawal" title="제14조 (이용계약의 해지)">
          <List
            items={[
              '언제든지 마이페이지에서 탈퇴하실 수 있습니다.',
              '서비스는 제13조의 영구 이용 제한 사유가 있을 때 이용계약을 해지할 수 있습니다.',
              '해지 뒤 개인정보를 어떻게 처리하는지는 개인정보처리방침에 적어 두었습니다.',
            ]}
          />
          <p>
            계정을 지우는 구체적인 방법은{' '}
            <Link href="/account-deletion" className="text-gray-900 underline">
              계정 삭제 안내
            </Link>
            에서 보실 수 있습니다.
          </p>
        </Section>

        <Section id="privacy" title="제15조 (개인정보의 보호)">
          <p>
            서비스는 「개인정보 보호법」을 지키며, 무엇을 왜 모으고 언제 지우는지는{' '}
            <Link href="/privacy" className="text-gray-900 underline">
              개인정보처리방침
            </Link>
            에 따로 적어 두었습니다.
          </p>
          <p>
            이용자의 잘못으로 계정 정보가 새어 나가 생긴 일에 대해서는 서비스가 책임지지 않습니다.
          </p>
        </Section>

        <Section id="liability" title="제16조 (책임의 한계)">
          <List
            items={[
              '천재지변이나 그에 준하는 어쩔 수 없는 사정으로 서비스를 제공하지 못한 경우, 서비스는 그에 대한 책임을 지지 않습니다.',
              '이용자의 잘못으로 생긴 장애에 대해서는 서비스가 책임지지 않습니다.',
              '이용자가 올린 정보가 사실인지, 믿을 만한지를 서비스가 보증하지는 않습니다.',
              '이용자끼리의 거래나 다툼에 서비스가 끼어들 의무는 없습니다. 다만 제7조에 적은 법에 따른 책임은 그대로 집니다.',
            ]}
          />
          <p className="font-medium text-gray-900">
            이 조는 서비스의 책임을 부당하게 줄이려는 것이 아닙니다. 서비스의 고의나 큰 잘못으로 생긴
            손해는 서비스가 책임집니다.
          </p>
        </Section>

        <Section id="shutdown" title="제17조 (서비스의 종료)">
          <p>
            서비스를 그만두게 되면 이용자가 미리 준비할 수 있도록 알려 드립니다. 문을 닫을 때 데이터가 어떻게
            되는지는 자주 묻는 질문이라 여기에 밝혀 둡니다.
          </p>
          <List
            items={[
              '종료일로부터 30일 전에 서비스 안에 알려 드립니다.',
              '알림에는 종료일, 남은 기간에 하실 수 있는 일, 문의처를 적습니다.',
              '종료일이 지나면 회원 정보와 게시물은 개인정보처리방침에 적은 대로 지웁니다. 법에서 일정 기간 보관하도록 정한 것만 그 기간 동안 따로 보관한 뒤 지웁니다.',
              '진행 중이던 이용자끼리의 거래는 종료 뒤에도 그 당사자들 사이에서 이어집니다. 다만 서비스 안의 채팅은 종료일 이후 쓸 수 없으므로, 남은 기간에 연락할 방법을 정해 두시기를 권합니다.',
            ]}
          />
        </Section>

        <Section id="dispute" title="제18조 (분쟁의 해결)">
          <List
            items={[
              '서비스를 쓰다 불편하거나 억울한 일이 있으면 먼저 제20조의 문의처로 알려 주세요. 확인해서 빠르게 처리하겠습니다.',
              '이용자끼리의 거래에서 생긴 다툼은 그 당사자들이 푸는 것이 원칙입니다. 서비스는 사실을 확인하는 데 필요한 자료를 제공하는 등으로 돕습니다.',
            ]}
          />
          <p>서비스와 이야기해도 풀리지 않으면 아래 기관에 도움을 요청하실 수 있습니다.</p>
          <dl>
            <Row label="소비자상담센터">ccn.go.kr / 국번없이 1372</Row>
            <Row label="한국소비자원">kca.go.kr</Row>
            <Row label="전자거래분쟁조정위원회">ecmc.or.kr</Row>
            <Row label="경찰청 사이버범죄 신고">ecrm.police.go.kr / 182</Row>
          </dl>
        </Section>

        <Section id="law" title="제19조 (준거법과 재판 관할)">
          <List
            items={[
              '이 약관과 서비스 이용에는 대한민국 법을 적용합니다.',
              '서비스와 이용자 사이에 소송이 필요해지면 「민사소송법」이 정한 법원에 냅니다.',
            ]}
          />
        </Section>

        <Section id="operator" title="제20조 (운영자 정보와 문의처)">
          <dl>
            <Row label="서비스 이름">커들마켓 (Cuddle Market)</Row>
            <Row label="운영자">강주현</Row>
            <Row label="문의">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 underline">
                {CONTACT_EMAIL}
              </a>
            </Row>
          </dl>
          <p>
            개인정보에 관한 문의도 같은 곳에서 받습니다. 처리 방침은{' '}
            <Link href="/privacy" className="text-gray-900 underline">
              개인정보처리방침
            </Link>
            을 봐 주세요.
          </p>
          <p className="font-medium text-gray-900">부칙 — 이 약관은 {EFFECTIVE_DATE}부터 적용합니다.</p>
        </Section>
      </div>
    </div>
  )
}
