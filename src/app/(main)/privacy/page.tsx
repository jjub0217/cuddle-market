import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 커들마켓',
  description: '커들마켓이 이용자의 개인정보를 어떻게 처리하는지 안내합니다.',
  alternates: {
    canonical: '/privacy',
  },
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = '2026년 7월 30일'

/** 방침의 한 장(章). 목차에서 이동할 수 있도록 id를 단다. */
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
  ['purpose', '1. 개인정보의 처리 목적'],
  ['items', '2. 처리하는 개인정보의 항목'],
  ['retention', '3. 개인정보의 처리 및 보유 기간'],
  ['disposal', '4. 개인정보의 파기 절차 및 방법'],
  ['third-party', '5. 개인정보의 제3자 제공'],
  ['outsourcing', '6. 개인정보 처리업무의 위탁'],
  ['overseas', '7. 개인정보의 국외 이전'],
  ['security', '8. 개인정보의 안전성 확보조치'],
  ['auto-collect', '9. 개인정보 자동 수집 장치의 설치·운영 및 거부'],
  ['rights', '10. 정보주체와 법정대리인의 권리·의무 및 행사방법'],
  ['officer', '11. 개인정보 보호책임자'],
  ['remedy', '12. 권익침해에 대한 구제방법'],
  ['not-applicable', '13. 해당하지 않는 사항'],
  ['changes', '14. 개인정보처리방침의 변경'],
] as const

export default function PrivacyPage() {
  return (
    // max-w-3xl 같은 티셔츠 크기는 이 프로젝트에서 쓰면 안 된다.
    // Tailwind v4가 --container-3xl 이 아니라 tokens.spacing.css 의 --spacing-3xl(48px)로
    // 풀어버려서 폭이 48px이 된다(실기기에서 글자가 한 자씩 떨어지는 것으로 확인).
    // 프로젝트가 쓰는 숫자 방식(max-w-170 = 170 × 0.25rem = 680px)을 따른다.
    <div className="mx-auto w-full max-w-170 px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">개인정보처리방침</h1>
      <p className="mb-8 text-sm text-gray-500">시행일: {EFFECTIVE_DATE}</p>

      <p className="mb-10 text-sm leading-relaxed text-gray-700">
        커들마켓(이하 &lsquo;서비스&rsquo;)은 이용자의 개인정보를 소중히 다루며 「개인정보 보호법」을
        지킵니다. 이 방침은 서비스가 어떤 정보를 왜 모으고, 어떻게 쓰고, 언제 지우는지를 이용자가 쉽게
        알 수 있도록 만든 것입니다.
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
        <Section id="purpose" title="1. 개인정보의 처리 목적">
          <p>서비스는 아래 목적으로만 개인정보를 처리하며, 목적이 바뀌면 미리 알리고 동의를 받습니다.</p>
          <List
            items={[
              '회원 관리 — 회원을 알아보고 로그인 상태를 유지하기 위해',
              '중고거래 — 상품을 사고팔고, 이용자끼리 채팅으로 연락하게 하기 위해',
              '커뮤니티 — 게시글과 댓글을 보여주기 위해',
              '이용자 보호 — 신고·차단을 처리하기 위해',
              '분쟁 대응 — 부정 이용을 막고, 분쟁이 생겼을 때 사실을 확인하기 위해',
            ]}
          />
          <p>서비스는 처리 목적에 필요한 최소한의 개인정보만 모읍니다.</p>
        </Section>

        <Section id="items" title="2. 처리하는 개인정보의 항목">
          <h3 className="pt-2 font-bold text-gray-900">회원 가입 때 직접 받는 정보</h3>
          <dl>
            <Row label="이메일로 가입">
              이메일 주소, 비밀번호, 이름, 닉네임, 생년월일 (필수) / 사는 지역 (선택)
            </Row>
            <Row label="구글·카카오로 가입">
              이메일 주소, 이름, 닉네임, 가입 경로, 소셜 서비스 회원번호 (필수)
            </Row>
          </dl>
          <List
            items={[
              '비밀번호는 되돌릴 수 없는 형태로 바꾸어 저장하며, 운영자도 원래 값을 볼 수 없습니다.',
              '사는 지역은 시/도와 구/군까지만 받습니다. 상세 주소는 받지 않습니다.',
              '구글·카카오로 가입한 경우 비밀번호와 생년월일은 받지 않습니다.',
            ]}
          />

          <h3 className="pt-4 font-bold text-gray-900">이용자가 서비스에 올리는 정보</h3>
          <p>
            프로필 사진, 소개글, 상품 정보(제목·설명·가격·사진·거래 상태), 채팅 메시지와 채팅으로 보낸
            사진, 커뮤니티 게시글·댓글과 첨부 사진, 찜한 상품 목록, 신고 내용, 차단한 이용자 목록, 탈퇴
            사유
          </p>

          <h3 className="pt-4 font-bold text-gray-900">자동으로 쌓이는 정보</h3>
          <p>가입일시, 정보 수정일시, 게시글 조회수 등 이용 기록</p>

          <h3 className="pt-4 font-bold text-gray-900">앱에서 요청하는 기기 권한</h3>
          <dl>
            <Row label="사진·미디어 접근">상품·프로필·채팅·게시글 사진을 올릴 때</Row>
            <Row label="카메라">사진을 그 자리에서 찍어 올릴 때</Row>
          </dl>
          <p>권한은 필요한 순간에만 요청하며, 거부해도 서비스의 다른 기능을 쓸 수 있습니다.</p>
        </Section>

        <Section id="retention" title="3. 개인정보의 처리 및 보유 기간">
          <List
            items={[
              '회원 정보는 회원으로 있는 동안 보유합니다.',
              '탈퇴하면 회원을 알아볼 수 있는 정보를 지웁니다. 이메일 주소, 비밀번호, 이름, 닉네임, 생년월일, 사는 지역, 프로필 사진, 소개글이 여기에 해당합니다.',
              '다만 탈퇴 사유는 누구인지 알 수 없는 형태로 남겨 서비스 개선을 위한 통계에만 씁니다.',
            ]}
          />
          <p>아래는 법에서 정한 기간 동안 따로 보관합니다.</p>
          <dl>
            <Row label="소비자 불만·분쟁 처리 기록">3년 (전자상거래법)</Row>
            <Row label="접속 기록">3개월 (통신비밀보호법)</Row>
          </dl>
          <p>
            서비스는 직접 결제를 처리하지 않으므로 대금 결제·재화 공급 기록(5년), 계약·청약철회
            기록(5년)은 해당하지 않습니다.
          </p>
        </Section>

        <Section id="disposal" title="4. 개인정보의 파기 절차 및 방법">
          <List
            items={[
              '보유 기간이 지나거나 처리 목적을 이룬 개인정보는 지체 없이 파기합니다.',
              '회원 탈퇴 시에는 회원을 알아볼 수 있는 정보를 즉시 지웁니다. 탈퇴 사유는 누구인지 알 수 없는 형태로만 남겨 통계에 씁니다.',
              '전자 파일 형태는 되살릴 수 없는 방법으로 지웁니다.',
              '종이에 출력된 것이 있으면 분쇄하거나 소각합니다.',
              '법에 따라 보존해야 하는 정보는 다른 개인정보와 분리해 보관한 뒤, 기간이 지나면 파기합니다.',
            ]}
          />
        </Section>

        <Section id="third-party" title="5. 개인정보의 제3자 제공">
          <p>서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 아래는 예외입니다.</p>
          <List
            items={['이용자가 미리 동의한 경우', '법에 따라 수사기관 등이 정해진 절차로 요구한 경우']}
          />

          <h3 className="pt-4 font-bold text-gray-900">이용자끼리 서로 보게 되는 정보</h3>
          <p>서비스 이용에 꼭 필요한 부분이므로 함께 밝힙니다.</p>
          <dl>
            <Row label="닉네임·프로필 사진·소개글">상품 상세, 프로필, 커뮤니티 글·댓글</Row>
            <Row label="사는 지역 (시/도, 구/군)">상품 상세</Row>
            <Row label="올린 상품과 커뮤니티 글·댓글">목록과 상세 화면</Row>
            <Row label="채팅 메시지">대화 상대에게만</Row>
          </dl>
          <p>이름·이메일·생년월일은 다른 이용자에게 보이지 않습니다.</p>
        </Section>

        <Section id="outsourcing" title="6. 개인정보 처리업무의 위탁">
          <p>서비스 운영을 위해 아래와 같이 처리업무를 위탁하고 있습니다.</p>
          <dl>
            <Row label="Amazon Web Services">서버 운영, 사진 파일 보관과 전송</Row>
            <Row label="Vercel">웹사이트 호스팅</Row>
            <Row label="Google, Kakao">소셜 로그인 인증</Row>
          </dl>
          <p>
            위탁계약 시 개인정보가 안전하게 관리되도록 필요한 사항을 정하고 있으며, 위탁받는 자가 바뀌면
            이 방침을 통해 알려 드립니다.
          </p>
        </Section>

        <Section id="overseas" title="7. 개인정보의 국외 이전">
          <p>
            이용자가 올린 사진은 Amazon Web Services 서울 지역(ap-northeast-2)에 저장합니다. 즉 원본은
            국내에 보관합니다.
          </p>
          <p>
            다만 사진을 빠르게 보여드리기 위해 Amazon CloudFront라는 전송망을 함께 씁니다. 이 전송망은
            이용자와 가까운 곳에서 사진을 내려주기 위해 세계 여러 나라의 서버에 사진의 임시 사본을 둘 수
            있습니다.
          </p>
          <dl>
            <Row label="이전되는 항목">
              이용자가 올린 사진 (상품 사진, 프로필 사진, 게시글·채팅 첨부 사진)
            </Row>
            <Row label="이전되는 국가">Amazon CloudFront가 운영하는 세계 각국의 전송 거점</Row>
            <Row label="이전 목적">사진을 빠르게 보여주기 위한 임시 저장(캐시)</Row>
            <Row label="이전 방법">이용자가 사진을 볼 때 통신망을 통해 전송</Row>
            <Row label="보유 기간">임시 사본은 일정 시간이 지나면 자동으로 지워집니다</Row>
            <Row label="거부 방법">사진을 올리지 않으면 이전되지 않습니다</Row>
          </dl>
          <p>이름·이메일·생년월일 등 회원 정보는 국외로 이전하지 않습니다.</p>
        </Section>

        <Section id="security" title="8. 개인정보의 안전성 확보조치">
          <p>서비스는 개인정보의 안전성을 위해 아래 조치를 하고 있습니다.</p>

          <h3 className="pt-2 font-bold text-gray-900">관리적 조치</h3>
          <List items={['개인정보에 접근할 수 있는 사람을 운영자 본인으로 최소한 제한하고 있습니다.']} />

          <h3 className="pt-2 font-bold text-gray-900">기술적 조치</h3>
          <List
            items={[
              '비밀번호는 되돌릴 수 없는 형태로 바꾸어 저장합니다.',
              '서비스와 이용자 사이의 통신을 암호화(HTTPS)합니다.',
              '앱은 로그인 인증 정보를 기기의 보안 저장소에 보관합니다.',
              '개인정보를 다루는 시스템에 대한 접근 권한을 관리합니다.',
            ]}
          />

          <h3 className="pt-2 font-bold text-gray-900">물리적 조치</h3>
          <List
            items={[
              '서버와 파일은 클라우드 사업자(Amazon Web Services)의 데이터센터에서 관리되며, 해당 시설의 물리적 보안 조치를 따릅니다.',
            ]}
          />
        </Section>

        <Section id="auto-collect" title="9. 개인정보 자동 수집 장치의 설치·운영 및 거부">
          <p>로그인 상태를 유지하려면 이용자의 기기에 인증 정보를 저장해야 합니다.</p>
          <dl>
            <Row label="웹 브라우저 저장소">
              로그인 인증 정보 — 새로고침해도 로그인이 풀리지 않게
            </Row>
            <Row label="웹 브라우저 임시 저장소">
              쓰다 만 게시글 내용 — 실수로 창을 닫아도 이어 쓸 수 있게
            </Row>
            <Row label="앱 기기 보안 저장소">
              로그인 인증 정보 — 앱을 껐다 켜도 로그인이 유지되게
            </Row>
          </dl>
          <p>
            <strong className="font-medium text-gray-900">거부 방법</strong>: 웹 브라우저 설정에서 저장을
            거부할 수 있습니다. 다만 그러면 로그인 상태가 유지되지 않습니다. 앱에서는 로그아웃하면 저장된
            인증 정보가 지워집니다.
          </p>
          <p>서비스는 광고나 이용자 행동 분석을 위한 추적 도구를 쓰지 않습니다.</p>
        </Section>

        <Section id="rights" title="10. 정보주체와 법정대리인의 권리·의무 및 행사방법">
          <p>이용자와 법정대리인은 언제든지 아래 권리를 행사할 수 있습니다.</p>
          <dl>
            <Row label="내 정보 열람·정정">마이페이지 &gt; 프로필 수정에서 직접 하실 수 있습니다</Row>
            <Row label="삭제 (회원 탈퇴)">마이페이지에서 직접 하실 수 있습니다</Row>
            <Row label="처리 정지 요청">아래 11장의 연락처로 알려 주세요</Row>
          </dl>
          <List
            items={[
              '요청을 받으면 10일 안에 처리하고 결과를 알려 드립니다.',
              '법정대리인이나 위임받은 사람을 통해서도 요청할 수 있습니다.',
              '권리 행사는 회원 가입과 같거나 더 쉬운 방법으로 할 수 있게 하고 있습니다.',
            ]}
          />
        </Section>

        <Section id="officer" title="11. 개인정보 보호책임자">
          <p>개인정보 처리에 관한 업무를 총괄하고, 이용자의 문의·불만·피해구제를 처리합니다.</p>
          <dl>
            <Row label="개인정보 보호책임자">강주현</Row>
            <Row label="이메일">
              <a href="mailto:devel.jjub@gmail.com" className="text-gray-900 underline">
                devel.jjub@gmail.com
              </a>
            </Row>
          </dl>
          <p>개인정보 열람·정정·삭제·처리정지 요청도 위 연락처로 받습니다.</p>
        </Section>

        <Section id="remedy" title="12. 권익침해에 대한 구제방법">
          <p>서비스의 처리에 만족하지 못하셨다면 아래 기관에 도움을 요청할 수 있습니다.</p>
          <dl>
            <Row label="개인정보침해 신고센터">privacy.kisa.or.kr / 국번없이 118</Row>
            <Row label="개인정보 분쟁조정위원회">kopico.go.kr / 1833-6972</Row>
            <Row label="대검찰청 사이버수사과">spo.go.kr / 1301</Row>
            <Row label="경찰청 사이버수사국">ecrm.police.go.kr / 182</Row>
          </dl>
        </Section>

        <Section id="not-applicable" title="13. 해당하지 않는 사항">
          <p>법에서 정한 기재사항 중 서비스에 해당하지 않는 것도 밝혀 둡니다.</p>
          <dl>
            <Row label="14세 미만 아동의 개인정보">
              만 14세 미만은 가입할 수 없습니다. 아동의 개인정보를 처리하지 않습니다
            </Row>
            <Row label="민감정보의 공개 가능성">
              건강·사상·정치적 견해 등 민감정보를 모으지 않습니다
            </Row>
            <Row label="가명정보 처리">가명정보를 만들거나 쓰지 않습니다</Row>
            <Row label="행태정보 수집 허용">
              제3자가 이용자 행태정보를 수집하도록 허용하지 않습니다
            </Row>
            <Row label="자동화된 결정">
              사람의 개입 없이 자동으로 이용자에게 영향을 주는 결정을 하지 않습니다
            </Row>
            <Row label="영상정보처리기기">폐쇄회로 텔레비전 등 영상기기를 운영하지 않습니다</Row>
            <Row label="국내대리인 지정">국내에서 서비스를 운영하므로 해당하지 않습니다</Row>
          </dl>
        </Section>

        <Section id="changes" title="14. 개인정보처리방침의 변경">
          <p>
            내용이 바뀌면 바뀌기 7일 전부터 서비스 안에 알려 드립니다. 이용자에게 불리하게 바뀌는
            경우에는 30일 전에 알려 드리며, 바뀐 부분을 비교해 볼 수 있도록 안내합니다.
          </p>
          <p className="font-medium text-gray-900">시행일: {EFFECTIVE_DATE}</p>
        </Section>
      </div>
    </div>
  )
}
