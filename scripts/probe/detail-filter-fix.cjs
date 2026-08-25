const { chromium } = require('playwright')

const 폭들 = [
  { w: 390,  이름: '390 (모바일)',        단추기대: '보임',   펼침기대: '접힘(단추로 연다)' },
  { w: 767,  이름: '767 (md 바로 아래)',  단추기대: '보임',   펼침기대: '접힘(단추로 연다)' },
  { w: 768,  이름: '768 (md 시작)',       단추기대: '숨김',   펼침기대: '⭐ 펼침' },
  { w: 1023,이름: '1023 (예전 사각지대)', 단추기대: '숨김',   펼침기대: '⭐ 펼침' },
  { w: 1440,이름: '1440 (데스크탑)',      단추기대: '숨김',   펼침기대: '⭐ 펼침' },
]

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  for (const p of 폭들) {
    const page = await browser.newPage({ viewport: { width: p.w, height: 900 } })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2200)
    const r = await page.evaluate(() => {
      const sec = document.querySelector('section[aria-label="세부 필터"]')
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '세부 필터')
      const 지역 = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('시/도'))
      return {
        세부필터_높이: sec ? Math.round(sec.getBoundingClientRect().height) : -1,
        단추_보이나: btn ? btn.offsetParent !== null : false,
        지역필터_보이나: !!지역 && 지역.offsetParent !== null,
      }
    })
    const 펼쳐짐 = r.세부필터_높이 > 0 && r.지역필터_보이나
    console.log(
      `${p.이름.padEnd(20)} 단추 ${(r.단추_보이나 ? '보임' : '숨김').padEnd(4)} (기대 ${p.단추기대})  ` +
      `높이 ${String(r.세부필터_높이).padStart(4)}  지역필터 ${r.지역필터_보이나 ? '보임' : '안보임'}  ` +
      `→ ${펼쳐짐 ? '펼침 ✅' : '접힘'}`
    )
    await page.close()
  }
  await browser.close()
})().catch((e) => { console.error('실패:', e.message); process.exit(1) })
