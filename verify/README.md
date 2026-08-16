# verify/

Checks for the two things that broke around scanning a sticker: the camera not being released, and
the console still believing in a tag that is gone.

    npm run verify          # both
    npm run verify:camera
    npm run verify:cache

Each runner starts a Vite dev server on port 5199 and stops it again, so nothing needs to be running
first. `npx playwright install chromium` once, if this machine has never done it. Both exit non-zero
on failure. Pass a port to reuse a dev server you already have up: `node verify/camera.mjs 5199`.

## camera — why it isn't a unit test

The scanner's failure mode is a `MediaStream` track left running after the overlay closes. A live
track holds the camera for the life of the tab, so the next open issues a fresh `getUserMedia`
instead of riding on the permission already granted — which is what surfaces as a permission prompt
on a site that already has permission. jsdom has no `MediaStream` and no camera, so a mocked
`getUserMedia` would only ever test the mock. These run in Chromium with a fake camera device.

Per scenario, after the scanner has been opened and closed:

- **no leaked camera** — every track opened is `ended`, none left `live`. This is the one that
  matters; the rest are how it breaks.
- **one request per open** — `getUserMedia` is called once per user-initiated open (twice under
  StrictMode, which double-invokes effects in dev — that is React, not us).
- **no uncaught errors** — the pre-fix teardown threw `Cannot stop, scanner is not running or
  paused.` out of an effect cleanup, which unmounted the whole React root.

The scenarios sweep how long the scanner stays open, because the bug lives entirely in the window
between "camera requested" and "camera running". The fake device comes up in tens of milliseconds;
a real phone camera takes 300ms–1.5s, so the field version of this window is far wider than the
`hold` values here suggest. Note the settle time before each measurement: releasing the camera is
asynchronous by design, and reading too early measures the race rather than a leak.

## cache — what the console still believes

Registering a vehicle against a tag deletes that tag server-side, so everything cached about the
scanned code behind it is wrong from that moment. So does deleting a tag by hand, and so does a 409
telling you another operator got there first.

These drive the real mutations against a stubbed server and inspect the query cache afterwards. The
case worth understanding is `stale_tick_offline`: the single lookup is *removed* rather than
invalidated because an invalidated query keeps serving its last value until a refetch succeeds, and
with `retry: false` one failed request is enough. On a phone with no signal that is a consumed
sticker still showing a green ✓ on the register form.

## What neither can cover

Chromium only. The re-prompt behaviour is worst on iOS Safari, and neither Playwright's WebKit build
nor the simulator reproduces real iOS camera-permission semantics. Releasing the camera correctly is
necessary there but only checkable by hand, on a device.
