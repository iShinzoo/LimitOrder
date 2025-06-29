import { NextResponse, NextRequest } from "next/server"

const CHAIN_ID = 11155111 // Sepolia testnet
const API_BASE_URL = "https://api.1inch.dev/orderbook/v4.0"

/**
 * POST /api/orders
 * Create a new limit order
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }

    const body = await req.json()
    const { order, signature } = body

    // Validate required fields
    if (!order || !signature) {
      return NextResponse.json(
        { message: "Missing required fields: order and signature" },
        { status: 400 }
      )
    }

    // Validate order structure
    const requiredFields = ['makerAsset', 'takerAsset', 'makingAmount', 'takingAmount', 'maker', 'receiver', 'salt', 'makerTraits']
    for (const field of requiredFields) {
      if (!(field in order)) {
        return NextResponse.json(
          { message: `Missing required order field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Submit order to 1inch API using the correct endpoint
    const url = `${API_BASE_URL}/${CHAIN_ID}/limit-order/order`
    console.log("API_BASE_URL:", API_BASE_URL)
    console.log("CHAIN_ID:", CHAIN_ID)
    console.log("Constructed URL:", url)
    console.log("Submitting to 1inch API:", url)
    console.log("Request payload:", JSON.stringify({
      order,
      signature,
      extension: "0x"
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order,
        signature,
        extension: "0x" // Empty extension for basic orders
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("1inch API Error:", errorText)
      console.error("Response status:", response.status)
      console.error("Response headers:", Object.fromEntries(response.headers.entries()))
      return NextResponse.json(
        { message: `1inch API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log("1inch API success response:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Order creation error:", error)
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
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "50"
    const sortBy = searchParams.get("sortBy") || "createDateTime"

    if (!address) {
      return NextResponse.json({ message: "Address parameter is required" }, { status: 400 })
    }

    // Get orders by maker address using the correct endpoint
    const url = `${API_BASE_URL}/${CHAIN_ID}/limit-order/order/maker/${address}?page=${page}&limit=${limit}&sortBy=${sortBy}`
    console.log("Fetching orders from:", url)
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("1inch API Error:", errorText)
      return NextResponse.json(
        { message: `1inch API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log("Orders fetched successfully:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Order fetch error:", error)
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
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const orderHash = searchParams.get("orderHash")

    if (!orderHash) {
      return NextResponse.json({ message: "Order hash parameter is required" }, { status: 400 })
    }

    // Note: 1inch API doesn't have a direct cancel endpoint
    // You would need to implement order cancellation on-chain
    // This is a placeholder for your cancellation logic
    
    return NextResponse.json({ 
      message: "Order cancellation requires on-chain transaction",
      orderHash 
    })
  } catch (error) {
    console.error("Order cancellation error:", error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}