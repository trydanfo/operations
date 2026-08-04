import { QRCodeSVG } from "qrcode.react"
import { vehicleScanUrl } from "./VehicleQR"

// TagSticker is a 1:1 translation of the Figma frame (node 199-141), authored at its native
// 830x1196 px and scaled to physical size by the .tag-sheet transform. Every value below is the
// Figma value verbatim — keep it that way so the design stays traceable to the source frame.
// The three diagonal highlight bars, taken from the exported SVG rather than Figma's CSS panel,
// whose post-rotation bounding-box offsets don't replay correctly as a CSS transform. SVG places a
// rect then rotates it about a pivot; CSS top/left already places the box, so the equivalent is a
// rotation about the element centre (the default transform-origin).
const STRIPES = [
  { width: 387.328, height: 1751.11, left: 516.61, top: 13.23 },
  { width: 387.328, height: 1381.53, left: -125.06, top: -462.42 },
  { width: 387.328, height: 1707.03, left: 111.42, top: -189.59 },
]

export function TagSticker({ code }: { code: string }) {
  return (
    <div className="tag-sticker">
      <div
        className="tag-sticker-frame relative overflow-hidden"
        style={{ background: "var(--color-sticker-bg)", borderRadius: 24 }}
      >
        {STRIPES.map((stripe, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              width: stripe.width,
              height: stripe.height,
              left: stripe.left,
              top: stripe.top,
              background: "#000000",
              opacity: 0.24,
              transform: "rotate(39.5deg)",
            }}
          />
        ))}

        {/* scan & board — one centred block, per the frame's own CSS. The 192px/91px leading is a
            deliberate tight stack that pulls the two rows together. The brown ampersand behind it
            is drawn separately below, since it straddles both rows and can't sit in the text run. */}
        <div
          className="absolute text-center"
          style={{
            width: 502,
            height: 275,
            left: "calc(50% - 502px/2 + 9px)",
            bottom: 890,
            fontFamily: "var(--font-sticker)",
            fontWeight: 900,
            fontSize: 192,
            lineHeight: "91px",
            letterSpacing: "-0.06em",
            color: "var(--color-sticker-ink)",
            zIndex: 2,
          }}
        >
          scan <span style={{ color: "#916D28" }}>&amp;</span> board
        </div>

        {/* Drop shadow plate sitting behind the QR card, offset down-left of it. */}
        <div
          className="absolute"
          style={{
            width: 608,
            height: 608,
            left: 124,
            top: 387,
            background: "var(--color-sticker-ink)",
            borderRadius: 24,
            transform: "rotate(-7.02deg)",
          }}
        />

        {/* The live QR replaces Figma's placeholder PNG. White padding inside the rounded card
            preserves the quiet zone the scanner needs at the rotated edges. */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            width: 608,
            height: 608,
            left: 137,
            top: 368,
            background: "#ffffff",
            borderRadius: 24,
            transform: "rotate(-7.02deg)",
          }}
        >
          <QRCodeSVG
            value={vehicleScanUrl(code)}
            size={548}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>

        <ScanTheCodeBadge />

        {/* stay safe */}
        <div
          className="absolute"
          style={{
            width: 193,
            height: 82,
            left: 40,
            bottom: 23,
            fontFamily: "var(--font-sticker)",
            fontWeight: 700,
            fontSize: 48,
            lineHeight: "81px",
            letterSpacing: "-0.04em",
            color: "var(--color-sticker-brown)",
          }}
        >
          stay safe
        </div>

        {/* URL pill with its offset hard shadow. */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            width: 268,
            height: 52,
            right: 25,
            bottom: 40,
            padding: "8px 12px",
            background: "var(--color-sticker-olive)",
            boxShadow: "-7px 7px 0px var(--color-sticker-ink)",
            borderRadius: 24,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sticker-url)",
              fontWeight: 600,
              fontSize: 32,
              lineHeight: "36px",
              letterSpacing: "-0.02em",
              color: "var(--color-sticker-bg)",
              opacity: 0.8,
            }}
          >
            https://danfo.ng
          </span>
        </div>
      </div>
    </div>
  )
}

// The badge is two stacked copies — a dark plate offset behind a yellow-on-olive face — which is
// how the source frame fakes a letterpress edge. Both layers carry the same -1.64deg tilt.
function ScanTheCodeBadge() {
  return (
    <>
      <BadgeLayer left={58.101} top={918.766} background="var(--color-sticker-ink)" color="var(--color-sticker-teal)" />
      <BadgeLayer left={62.899} top={911.654} background="var(--color-sticker-olive)" color="var(--color-sticker-bg)" />
    </>
  )
}

function BadgeLayer({
  left,
  top,
  background,
  color,
}: {
  left: number
  top: number
  background: string
  color: string
}) {
  return (
    <div
      className="absolute flex flex-col items-start"
      style={{
        width: 151,
        height: 132.79,
        left,
        top,
        padding: "4px 4px 0px",
        background,
        transform: "rotate(-1.64deg)",
      }}
    >
      <span
        style={{
          width: 143,
          height: 48,
          fontFamily: "var(--font-sticker-badge)",
          fontWeight: 400,
          fontSize: 43.7538,
          lineHeight: "48px",
          letterSpacing: "-0.03em",
          color,
          margin: "-7.21008px 0px",
        }}
      >
        SCAN THE
      </span>
      <span
        style={{
          width: 143,
          height: 88,
          fontFamily: "var(--font-sticker-badge)",
          fontWeight: 400,
          fontSize: 79.9859,
          lineHeight: "87px",
          letterSpacing: "-0.03em",
          color,
        }}
      >
        CODE
      </span>
    </div>
  )
}
