// Tab 이 각 화면의 건너뛰기 링크(SkipToLoadMoreLink)까지 몇 번 눌러야 닿는지 잰다.
// #1061 이슈 초안 조사용. 로그인이 필요한 화면(알림·채팅)은 이미 로그인된
// persistent 프로필(/tmp/cuddle-menu-profile, 게이트798 계정)을 쓴다.
const { chromium } = require('playwright')

const PAGES = [
  { name: '홈', url: 'http://localhost:3000/', needsAuth: false },
  { name: '커뮤니티', url: 'http://localhost:3000/community', needsAuth: false },
  { name: '알림', url: 'http://localhost:3000/notifications', needsAuth: true },
  { name: '채팅방 목록', url: 'http://localhost:3000/chat', needsAuth: true },
]

async function measure(page, label) {
  await page.evaluate(() => document.body.focus())
  const 순서 = []
  let 링크까지 = -1
  for (let i = 0; i < 250; i++) {
    await page.keyboard.press('Tab')
    const cur = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const section = el.closest('[aria-label]')
      const header = el.closest('header')
      return {
        tag: el.tagName,
        cls: String(el.className || '').slice(0, 30),
        txt: (el.textContent || '').trim().slice(0, 22),
        href: el.getAttribute && el.getAttribute('href'),
        section: header ? 'header' : section ? section.getAttribute('aria-label') : null,
      }
    })
    if (!cur) continue
    순서.push(cur)
    if (cur.tag === 'A' && cur.txt.includes('건너뛰고')) {
      링크까지 = i + 1
      break
    }
  }
  console.log(`\n=== ${label} ===`)
  if (링크까지 > 0) {
    console.log(`✅ 건너뛰기 링크까지 Tab ${링크까지} 번`)
  } else {
    console.log(`❌ 링크 없음 또는 250번 안에 못 닿음 (총 ${순서.length}개 초점 대상)`)
    console.log('마지막 10개:', JSON.stringify(순서.slice(-10).map((x) => x.txt || x.tag)))
  }
  // 앞부분 구성 breakdown: 태그별 개수 + section(aria-label/header)별 개수
  const counts = {}
  const bySection = {}
  for (const x of 순서) {
    counts[x.tag] = (counts[x.tag] || 0) + 1
    const key = x.section || '(구역 표시 없음)'
    bySection[key] = (bySection[key] || 0) + 1
  }
  console.log('전체 초점 대상 태그별 개수(링크 포함):', JSON.stringify(counts))
  console.log('구역(aria-label/header)별 개수:', JSON.stringify(bySection))
  return { label, 링크까지, total: 순서.length, counts, 순서 }
}

;(async () => {
  const results = []

  // 로그인 필요 없는 화면 — 새 익명 컨텍스트
  const browser = await chromium.launch({ channel: 'chrome' })
  for (const p of PAGES.filter((p) => !p.needsAuth)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(p.url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    results.push(await measure(page, p.name))
    await page.close()
  }
  await browser.close()

  // 로그인 필요한 화면 — persistent 프로필
  const authCtx = await chromium.launchPersistentContext('/tmp/cuddle-menu-profile', {
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
  })
  for (const p of PAGES.filter((p) => p.needsAuth)) {
    const page = await authCtx.newPage()
    // ⚠️ 알림/채팅은 SSE·WebSocket 연결이 계속 열려 있어 networkidle 이 영영 안 온다.
    //    load 로 바꾼다.
    await page.goto(p.url, { waitUntil: 'load' })
    await page.waitForTimeout(3000)
    results.push(await measure(page, p.name))
    await page.close()
  }
  await authCtx.close()

  console.log('\n\n=== 요약 ===')
  for (const r of results) {
    console.log(`${r.label}: ${r.링크까지 > 0 ? r.링크까지 + '번' : '못 닿음'}`)
  }
})().catch((e) => {
  console.error('실패:', e.message)
  process.exit(1)
})
