// Camera-lifecycle checks for the tag scanner. See ./README.md for why these run in a real browser.
//
// Usage: npm run verify:camera        (starts and stops its own Vite server)
//        node verify/camera.mjs 5199  (reuse a dev server already on that port)

import { spawn } from "node:child_process"
import { chromium } from "playwright"

const PORT = Number(process.argv[2] ?? 5199)
const BASE = `http://localhost:${PORT}/verify/harness.html`

// html5-qrcode calls video.play() internally and does not catch the rejection that follows when the
// element is removed mid-start. It is noise from inside the library, present before and after our
// teardown fix, and it has no effect on whether the camera is released.
const KNOWN_NOISE = [/The play\(\) request was interrupted/]

// Failure injections. Each replaces getUserMedia with a rejection, so the scanner meets the camera
// states a phone actually produces: permission refused, no camera, camera held by another app.
const REJECTIONS = {
  denied: ["Permission denied", "NotAllowedError"],
  missing: ["Requested device not found", "NotFoundError"],
  busy: ["Could not start video source", "NotReadableError"],
}

const scenarios = [
  // The everyday path, in both effect models.
  { name: "dev (StrictMode), camera reaches steady state", strict: true, cycles: 3, hold: 1500 },
  { name: "prod, camera reaches steady state", strict: false, cycles: 3, hold: 1500 },

  // The bug's home: torn down between "camera requested" and "camera running".
  { name: "dev (StrictMode), closed mid-start", strict: true, cycles: 3, hold: 0 },
  { name: "prod, closed mid-start", strict: false, cycles: 3, hold: 0 },
  { name: "prod, closed at 20ms", strict: false, cycles: 3, hold: 20 },
  { name: "prod, closed at 150ms", strict: false, cycles: 3, hold: 150 },

  // Reopening on top of a previous open — a leak here compounds per cycle.
  { name: "prod, hammered open/close with no settle", strict: false, cycles: 6, hold: 0, settle: 0 },

  // The real success path: a decoded QR unmounts the overlay from inside the scanner's callback.
  { name: "prod, unmounted by a decode hit", strict: false, cycles: 3, decode: true },

  // Camera states that are not "it worked".
  { name: "prod, permission refused", strict: false, cycles: 3, hold: 400, reject: "denied" },
  { name: "prod, no camera on the device", strict: false, cycles: 2, hold: 400, reject: "missing" },
  { name: "prod, camera busy elsewhere", strict: false, cycles: 2, hold: 400, reject: "busy" },
]

function url({ strict, decode }) {
  const params = new URLSearchParams()
  if (!strict) params.set("strict", "off")
  if (decode) params.set("decode", "on")
  const query = params.toString()
  return query ? `${BASE}?${query}` : BASE
}

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

async function runScenario(browser, scenario) {
  const { cycles, hold = 0, settle = 800, decode = false, reject, strict } = scenario
  const context = await browser.newContext({ permissions: ["camera"] })
  const page = await context.newPage()
  const pageErrors = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.addInitScript(
    ({ rejection }) => {
      const state = { calls: 0, tracks: [] }
      window.__cam = state
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        state.calls++
        if (rejection) throw new DOMException(rejection[0], rejection[1])
        const stream = await original(constraints)
        for (const track of stream.getTracks()) state.tracks.push(track)
        return stream
      }
    },
    { rejection: reject ? REJECTIONS[reject] : null },
  )

  await page.goto(url(scenario), { waitUntil: "networkidle" })

  for (let i = 0; i < cycles; i++) {
    await page.click("#open")
    if (decode) {
      await page.waitForTimeout(1400) // the harness closes itself once the "hit" lands
    } else {
      await page.waitForTimeout(hold)
      await page.click("#close")
    }
    await page.waitForTimeout(settle)
  }

  // Releasing the camera is asynchronous by design — teardown waits for start() to settle before it
  // can stop anything — so give the last cycle room to finish. Without this the scenarios that close
  // with no settle time measure the race, not the leak.
  await page.waitForTimeout(1500)

  const counts = await page.evaluate(() => ({
    calls: window.__cam.calls,
    live: window.__cam.tracks.filter((track) => track.readyState === "live").length,
    ended: window.__cam.tracks.filter((track) => track.readyState === "ended").length,
  }))
  await context.close()

  const noise = pageErrors.filter((message) => KNOWN_NOISE.some((pattern) => pattern.test(message)))
  const errors = pageErrors.filter((message) => !noise.includes(message))
  const expectedCalls = cycles * (strict ? 2 : 1)

  const failures = []
  // The invariant that matters: nothing still holding the camera once the overlay is gone.
  if (counts.live !== 0) failures.push(`${counts.live} camera track(s) left live`)
  // One request per open. More would mean we ask again where we should be reusing the grant; the
  // doubling under StrictMode is React's dev-only double-invoke, not ours.
  if (counts.calls !== expectedCalls) failures.push(`getUserMedia called ${counts.calls}×, expected ${expectedCalls}`)
  // An effect cleanup that throws takes the React root down with it.
  if (errors.length) failures.push(`uncaught: ${errors[0]}`)
  // A scenario that never opened the camera is passing vacuously.
  if (counts.calls === 0) failures.push("camera was never requested — harness did not run")

  return { ...scenario, ...counts, noise: noise.length, failures }
}

let vite
if (!process.argv[2]) {
  vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore" })
}
await waitForServer()

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
})

const results = []
for (const scenario of scenarios) {
  const result = await runScenario(browser, scenario)
  results.push(result)
  const mark = result.failures.length ? "FAIL" : "ok  "
  console.log(
    `${mark} ${result.name.padEnd(46)} opened=${String(result.calls).padStart(2)} live=${result.live} ended=${String(result.ended).padStart(2)}`,
  )
  for (const failure of result.failures) console.log(`       ↳ ${failure}`)
}

await browser.close()
vite?.kill()

const failed = results.filter((result) => result.failures.length)
const noisy = results.reduce((total, result) => total + result.noise, 0)
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed` + (noisy ? ` (${noisy} known library warning(s) ignored)` : ""))
process.exit(failed.length ? 1 : 0)
