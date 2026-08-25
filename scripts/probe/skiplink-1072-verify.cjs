// #1072 검증 — ① Tab 몇 번에 새 링크에 닿나 ② 링크가 정말 보이나(자리를 미나)
// ③ 목적지로 초점이 가나 ④ 전역 초점 규칙이 목록 섹션에 테두리를 그리나
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // 고치기 전 자리 — 목록 섹션의 위치와 문서 높이
  const 전 = await page.evaluate(() => {
    const s = document.getElementById('home-product-list')
    return { top: s ? s.getBoundingClientRect().top : null, docH: document.body.scrollHeight }
  })

  await page.evaluate(() => document.body.focus())
  let 닿은칸 = -1
  const 순서 = []
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab')
    const cur = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      return { tag: el.tagName, txt: (el.textContent || '').trim().slice(0, 24) }
    })
    if (!cur) continue
    순서.push(cur)
    if (cur.tag === 'A' && cur.txt.includes('필터 건너뛰고')) { 닿은칸 = i + 1; break }
  }
  console.log(`\n① 새 링크까지 Tab: ${닿은칸}번   (고치기 전 65번)`)
  console.log('   거쳐 온 것:', 순서.map((o) => `${o.tag}:${o.txt}`).join(' → '))

  // ② 링크가 초점을 받았을 때 — 보이나 · 자리를 미나 · 헤더에 가리나
  const 링크 = await page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const 가운데 = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    const s = document.getElementById('home-product-list')
    return {
      크기: `${Math.round(r.width)}×${Math.round(r.height)}`,
      자리: `top ${Math.round(r.top)} / left ${Math.round(r.left)}`,
      position: cs.position,
      clip: cs.clip,
      배경: cs.backgroundColor,
      테두리: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      맨앞인가: 가운데 === el || el.contains(가운데),
      맨앞에있는것: 가운데 ? `${가운데.tagName}.${String(가운데.className).slice(0, 24)}` : null,
      목록top: s ? Math.round(s.getBoundingClientRect().top) : null,
      docH: document.body.scrollHeight,
    }
  })
  console.log('\n② 초점 받은 링크:', 링크)
  console.log(`   자리 밀림: 목록 top ${Math.round(전.top)} → ${링크.목록top} · 문서 높이 ${전.docH} → ${링크.docH}`)

  // ③④ 엔터 → 목적지로 가나 · 섹션에 테두리가 그려지나
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const 뒤 = await page.evaluate(() => {
    const el = document.activeElement
    const s = document.getElementById('home-product-list')
    const cs = s ? getComputedStyle(s) : null
    return {
      초점간곳: el ? `${el.tagName}#${el.id || '(id없음)'}` : null,
      섹션테두리: cs ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : null,
      섹션matches초점: s ? s.matches(':focus-visible') : null,
      스크롤: Math.round(window.scrollY),
    }
  })
  console.log('\n③④ 엔터 뒤:', 뒤)

  // 엔터 뒤 Tab 하나 더 — 목록 쪽으로 이어지나
  await page.keyboard.press('Tab')
  const 다음 = await page.evaluate(() => {
    const el = document.activeElement
    const sec = el && el.closest('[aria-label]')
    return { tag: el.tagName, txt: (el.textContent || '').trim().slice(0, 24), 구역: sec ? sec.getAttribute('aria-label') : null }
  })
  console.log('   그다음 Tab:', 다음)

  await browser.close()
})()
