const { chromium } = require('playwright')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } })
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '세부 필터')
    if (b) b.click()
  })
  await page.waitForTimeout(900)

  const 상태 = () => page.evaluate(() => {
    const el = document.activeElement
    const active = el.getAttribute('aria-activedescendant')
    const opt = active ? document.getElementById(active) : null
    return {
      초점: el.tagName + (el.getAttribute('aria-haspopup') ? '(여는단추)' : ''),
      열림: el.getAttribute('aria-expanded'),
      후보: opt ? opt.textContent.trim().slice(0, 12) : '(없음)',
      페이지스크롤: Math.round(window.scrollY),
    }
  })

  // 「시/도 선택」 단추로 Tab 이동
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('시/도'))
    if (b) b.focus()
  })
  console.log('단추에 초점 :', JSON.stringify(await 상태()))

  await page.keyboard.press('Enter'); await page.waitForTimeout(500)
  console.log('엔터(열기)  :', JSON.stringify(await 상태()))

  for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown']) {
    await page.keyboard.press(k); await page.waitForTimeout(250)
    console.log(`${k}   :`, JSON.stringify(await 상태()))
  }
  await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250)
  console.log('ArrowUp     :', JSON.stringify(await 상태()))
  await page.keyboard.press('End'); await page.waitForTimeout(250)
  console.log('End         :', JSON.stringify(await 상태()))
  await page.keyboard.press('Home'); await page.waitForTimeout(250)
  console.log('Home        :', JSON.stringify(await 상태()))

  await page.keyboard.press('Enter'); await page.waitForTimeout(700)
  const 끝 = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-haspopup') === 'listbox')
    return { 열림: b ? b.getAttribute('aria-expanded') : '?', 고른값: b ? b.textContent.trim().slice(0, 14) : '?' }
  })
  console.log('엔터(고르기):', JSON.stringify(끝))
  await browser.close()
})().catch((e) => { console.error('실패:', e.message); process.exit(1) })
