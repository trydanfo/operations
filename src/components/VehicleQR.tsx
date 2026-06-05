import { QRCodeSVG } from "qrcode.react"

const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL ?? "https://app.danfo.ng"

export function vehicleScanUrl(publicCode: string) {
  return `${publicAppUrl}/v/${publicCode}`
}

export function VehicleQR({ publicCode, size = 160 }: { publicCode: string; size?: number }) {
  return (
    <QRCodeSVG
      value={vehicleScanUrl(publicCode)}
      size={size}
      bgColor="#ffffff"
      fgColor="#1a1710"
      level="M"
    />
  )
}
