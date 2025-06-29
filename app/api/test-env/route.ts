import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { 
        status: "error", 
        message: "API key not configured",
        instructions: "Create a .env.local file with NEXT_PUBLIC_1INCH_API_KEY=your_api_key"
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    status: "success",
    message: "API key is configured",
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.substring(0, 8) + "..."
  })
} 