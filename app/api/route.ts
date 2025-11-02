// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'HEALTHY',
    current_time: new Date().toISOString(),
    service: 'WalnutFolks Transaction Service',
    version: '1.0.0'
  })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}