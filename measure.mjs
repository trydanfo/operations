import { chromium } from "playwright"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } })
await page.addInitScript(() => {
  window.print = () => {}
})
await page.goto("http://localhost:5199/preview.html?codes=ABC123", { waitUntil: "networkidle" })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

const data = await page.evaluate(() => {
  const frame = document.querySelector(".tag-sticker-frame")
  const fr = frame.getBoundingClientRect()
  const scale = fr.width / 830
  const out = { scale, frameW: fr.width, frameH: fr.height, children: [] }
  for (const el of frame.children) {
    const r = el.getBoundingClientRect()
    out.children.push({
      cls: el.className.slice(0, 24),
      text: (el.textContent || "").trim().slice(0, 14),
      // convert back into the frame's own 830x1196 coordinate space
      x: +((r.left - fr.left) / scale).toFixed(1),
      y: +((r.top - fr.top) / scale).toFixed(1),
      w: +(r.width / scale).toFixed(1),
      h: +(r.height / scale).toFixed(1),
    })
  }
  return out
})
console.log(JSON.stringify(data, null, 1))
await browser.close()
