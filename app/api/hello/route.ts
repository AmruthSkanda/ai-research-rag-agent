import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Hello from AI Publishing Platform API!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "/api/hello",
      chatbot: "/api/chatbot (coming soon)",
      analytics: "/api/analytics (coming soon)",
      publications: "/api/publications (coming soon)",
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    return NextResponse.json({
      message: "Hello POST request received!",
      receivedData: body,
      timestamp: new Date().toISOString(),
      status: "success",
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid JSON in request body",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        status: "error",
      },
      { status: 400 },
    )
  }
}
