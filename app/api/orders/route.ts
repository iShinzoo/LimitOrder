import { NextResponse, NextRequest } from "next/server"

const CHAIN_ID = 137 // Polygon mainnet
const API_BASE_URL = "https://api.1inch.dev/orderbook/v4.0"

/**
 * POST /api/orders
 * Create a new limit order
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[POST /api/orders] Incoming request...")
    let body
    try {
      body = await req.json()
      console.log("[POST /api/orders] Request body:", JSON.stringify(body, null, 2))
    } catch (err) {
      console.error("[POST /api/orders] Failed to parse JSON body:", err)
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
    }
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      console.error("[POST /api/orders] API key not configured")
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }
    const { orderHash, signature, data } = body
    // Validate required fields
    if (!orderHash || !signature || !data) {
      console.error("[POST /api/orders] Missing required fields:", { orderHash, signature, data })
      return NextResponse.json(
        { message: "Missing required fields: orderHash, signature, and data" },
        { status: 400 }
      )
    }
    // Validate order structure
    const requiredFields = ['makerAsset', 'takerAsset', 'makingAmount', 'takingAmount', 'maker', 'receiver', 'salt', 'makerTraits']
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`[POST /api/orders] Missing required order field: ${field}`)
        return NextResponse.json(
          { message: `Missing required order field: ${field}` },
          { status: 400 }
        )
      }
    }
    // Submit order to 1inch API using the correct endpoint and body
    const url = `${API_BASE_URL}/${CHAIN_ID}`
    console.log("[POST /api/orders] API_BASE_URL:", API_BASE_URL)
    console.log("[POST /api/orders] CHAIN_ID:", CHAIN_ID)
    console.log("[POST /api/orders] Constructed URL:", url)
    const outgoingHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    console.log("[POST /api/orders] Outgoing request headers:", outgoingHeaders)
    console.log("[POST /api/orders] Submitting to 1inch API:", url)
    console.log("[POST /api/orders] Request payload:", JSON.stringify({ orderHash, signature, data }, null, 2))
    const response = await fetch(url, {
      method: 'POST',
      headers: outgoingHeaders,
      body: JSON.stringify({
        orderHash,
        signature,
        data
      }),
    })
    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch (err) {
      result = responseText
    }
    if (!response.ok) {
      console.error("[POST /api/orders] 1inch API Error:", result)
      console.error("[POST /api/orders] Response status:", response.status)
      console.error("[POST /api/orders] Response headers:", Object.fromEntries(response.headers.entries()))
      return NextResponse.json(
        { message: `1inch API error: ${response.status} - ${typeof result === 'string' ? result : JSON.stringify(result)}` },
        { status: response.status }
      )
    }
    console.log("[POST /api/orders] 1inch API success response:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/orders] Order creation error:", error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders?address={address}
 * Get orders for a specific address
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[GET /api/orders] Incoming request...", req.url)
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      console.error("[GET /api/orders] API key not configured")
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "50"
    const sortBy = searchParams.get("sortBy") || "createDateTime"
    if (!address) {
      console.error("[GET /api/orders] Address parameter is required")
      return NextResponse.json({ message: "Address parameter is required" }, { status: 400 })
    }
    // Get orders by maker address using the correct endpoint
    const url = `${API_BASE_URL}/${CHAIN_ID}/limit-order/order/maker/${address}?page=${page}&limit=${limit}&sortBy=${sortBy}`
    console.log("[GET /api/orders] Fetching orders from:", url)
    const outgoingHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    console.log("[GET /api/orders] Outgoing request headers:", outgoingHeaders)
    const response = await fetch(url, {
      headers: outgoingHeaders,
    })
    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch (err) {
      result = responseText
    }
    if (!response.ok) {
      console.error("[GET /api/orders] 1inch API Error:", result)
      return NextResponse.json(
        { message: `1inch API error: ${response.status} - ${typeof result === 'string' ? result : JSON.stringify(result)}` },
        { status: response.status }
      )
    }
    console.log("[GET /api/orders] Orders fetched successfully:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/orders] Order fetch error:", error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/orders/{orderHash}
 * Cancel an order (if supported by your implementation)
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log("[DELETE /api/orders] Incoming request...", req.url)
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      console.error("[DELETE /api/orders] API key not configured")
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const orderHash = searchParams.get("orderHash")
    if (!orderHash) {
      console.error("[DELETE /api/orders] Order hash parameter is required")
      return NextResponse.json({ message: "Order hash parameter is required" }, { status: 400 })
    }
    // Note: 1inch API doesn't have a direct cancel endpoint
    // You would need to implement order cancellation on-chain
    // This is a placeholder for your cancellation logic
    console.log("[DELETE /api/orders] Order cancellation requested for orderHash:", orderHash)
    return NextResponse.json({ 
      message: "Order cancellation requires on-chain transaction",
      orderHash 
    })
  } catch (error) {
    console.error("[DELETE /api/orders] Order cancellation error:", error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}