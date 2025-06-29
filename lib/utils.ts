import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string, decimals = 6): string {
  const num = Number.parseFloat(price)
  if (isNaN(num)) return "0.00"

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function getExpirationTimestamp(duration: string): number {
  const now = Math.floor(Date.now() / 1000)
  switch (duration) {
    case "1h":
      return now + 3600
    case "1d":
      return now + 86400
    case "1w":
      return now + 604800
    default:
      return now + 86400
  }
}
