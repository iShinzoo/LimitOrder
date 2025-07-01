import { NextResponse, NextRequest } from "next/server"

const CHAIN_ID = 137 // Polygon mainnet
const DEFAULT_BASE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" // ETH
const DEFAULT_QUOTE = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" // USDC

/**
 * GET /api/price
 * Uses 1inch Price API to return the ETH/USDC rate.
 * Based on the Python reference implementation.
 * Response → { price: string, timestamp: number }
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }

    // Parse query params for base and quote
    const { searchParams } = new URL(req.url)
    const base = (searchParams.get("base") || DEFAULT_BASE).toLowerCase()
    const quote = (searchParams.get("quote") || DEFAULT_QUOTE).toLowerCase()

    // Compose the price API URL
    const url = `https://api.1inch.dev/price/v1.1/${CHAIN_ID}/${base},${quote}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    })

    if (!res.ok) {
      const txt = await res.text()
      if (res.status === 401) {
        return NextResponse.json({ message: "Invalid API key" }, { status: 401 })
      } else if (res.status === 429) {
        return NextResponse.json({ message: "Rate limit exceeded" }, { status: 429 })
      } else {
        return NextResponse.json({ message: `1inch API error: ${res.status} - ${txt}` }, { status: 502 })
      }
    }

    const data = await res.json()
    // Find the addresses in the response (case-insensitive)
    const baseAddress = Object.keys(data).find(key => key.toLowerCase() === base)
    const quoteAddress = Object.keys(data).find(key => key.toLowerCase() === quote)
    if (!baseAddress || !quoteAddress) {
      return NextResponse.json({ message: "Base or quote token not found in API response" }, { status: 502 })
    }
    const basePrice = parseFloat(data[baseAddress])
    const quotePrice = parseFloat(data[quoteAddress])
    const price = basePrice / quotePrice
    return NextResponse.json({ price: price.toString(), timestamp: Date.now() })
  } catch (err) {
    return NextResponse.json({ message: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 })
  }
}

/**
 * POST /api/price
 * Alternative method using POST with tokens payload (as shown in Python reference)
 */
export async function POST() {
  try {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      console.error("1inch API key is not configured")
      return NextResponse.json(
        { message: "API key not configured" },
        { status: 500 }
      )
    }

    console.log("Fetching ETH/USDC price from 1inch Price API (POST method)...")
    
    const url = `https://api.1inch.dev/price/v1.1/${CHAIN_ID}`
    const payload = {
      tokens: [DEFAULT_BASE, DEFAULT_QUOTE]
    }

    console.log("API URL:", url)
    console.log("Payload:", payload)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("1inch API response status:", res.status)

    if (!res.ok) {
      const txt = await res.text()
      console.error("1inch API error:", res.status, txt)
      
      if (res.status === 401) {
        return NextResponse.json(
          { message: "Invalid API key" },
          { status: 401 }
        )
      } else if (res.status === 429) {
        return NextResponse.json(
          { message: "Rate limit exceeded" },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          { message: `1inch API error: ${res.status} - ${txt}` },
          { status: 502 }
        )
      }
    }

    const data = await res.json()
    console.log("1inch API response data:", data)

    // Find the addresses in the response (case-insensitive)
    const baseAddress = Object.keys(data).find(key => key.toLowerCase() === DEFAULT_BASE.toLowerCase())
    const quoteAddress = Object.keys(data).find(key => key.toLowerCase() === DEFAULT_QUOTE.toLowerCase())
    
    if (!baseAddress || !quoteAddress) {
      console.error("ETH or USDC not found in response:", data)
      return NextResponse.json(
        { message: "ETH or USDC not found in API response" },
        { status: 502 }
      )
    }

    // Calculate ETH price in USDC
    const basePrice = parseFloat(data[baseAddress])
    const quotePrice = parseFloat(data[quoteAddress])
    const price = basePrice / quotePrice

    const response = {
      price: price.toString(),
      timestamp: Date.now(),
    }

    console.log("Returning price data:", response)
    return NextResponse.json(response)
  } catch (err) {
    console.error("Price API error:", err)
    return NextResponse.json(
      { message: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
