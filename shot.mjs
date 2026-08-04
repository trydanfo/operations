import { chromium } from "playwright"

const url = process.argv[2]
const out = process.argv[3]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } })
page.on("pageerror", (e) => console.log("[pageerror]", e.message))
await page.addInitScript(() => {
  window.print = () => {}
})
await page.goto(url, { waitUntil: "networkidle" })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)
await page.screenshot({ path: out })
console.log("ok", out)
await browser.close()
