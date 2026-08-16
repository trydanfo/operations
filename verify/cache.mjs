// Tag-cache checks: what the console still believes about a scanned code after the tag behind it is
// gone. See ./README.md.
//
// Usage: npm run verify:cache        (starts and stops its own Vite server)
//        node verify/cache.mjs 5199  (reuse a dev server already on that port)

import { spawn } from "node:child_process"
import { chromium } from "playwright"

const PORT = Number(process.argv[2] ?? 5199)
const BASE = `http://localhost:${PORT}/verify/cache.html`

const CASES = [
  "consumed",
  "untagged",
  "conflict",
  "dead_connection",
  "deleted",
  "normalised",
  "stale_tick_offline",
]

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE)
      if (response.ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Vite did not come up on port ${PORT}`)
}

let vite
if (!process.argv[2]) {
  vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore" })
}
await waitForServer()

const browser = await chromium.launch()
const results = []

for (const name of CASES) {
  const page = await browser.newPage()
  const pageErrors = []
  page.on("pageerror", (error) => pageErrors.push(error.message))
  await page.goto(`${BASE}?case=${name}`, { waitUntil: "networkidle" })

  let result
  try {
    await page.waitForFunction(() => window.__result !== undefined, null, { timeout: 15000 })
    result = await page.evaluate(() => window.__result)
  } catch {
    result = { name, checks: [{ label: "case reported a result", pass: false }] }
  }
  await page.close()

  if (pageErrors.length) result.checks.push({ label: `no uncaught errors (${pageErrors[0]})`, pass: false })
  results.push(result)

  const failed = result.checks.filter((check) => !check.pass)
  console.log(`${failed.length ? "FAIL" : "ok  "} ${result.name}`)
  for (const check of result.checks) console.log(`       ${check.pass ? "·" : "↳ FAILED:"} ${check.label}`)
}

await browser.close()
vite?.kill()

const failed = results.filter((result) => result.checks.some((check) => !check.pass))
console.log(`\n${results.length - failed.length}/${results.length} cases passed`)
process.exit(failed.length ? 1 : 0)
