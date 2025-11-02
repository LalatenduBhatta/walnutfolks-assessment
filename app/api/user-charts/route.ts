// app/api/user-charts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/superbase'

export async function POST(request: NextRequest) {
  try {
    const { email, chartData, action } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (action === 'save') {
      if (!chartData) {
        return NextResponse.json(
          { error: 'Chart data is required for save action' },
          { status: 400 }
        )
      }

      // Validate chart data structure
      if (!chartData.callDuration || !chartData.sadPath) {
        return NextResponse.json(
          { error: 'Invalid chart data structure' },
          { status: 400 }
        )
      }

      // Save or update chart data
      const { error } = await supabase
        .from('user_charts')
        .upsert({
          email: email.toLowerCase().trim(),
          chart_data: chartData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })

      if (error) {
        console.error('Error saving chart data:', error)
        return NextResponse.json(
          { error: 'Failed to save chart data' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true,
        message: 'Chart data saved successfully'
      })

    } else if (action === 'get') {
      // Get existing chart data
      const { data, error } = await supabase
        .from('user_charts')
        .select('chart_data, updated_at')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching chart data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch chart data' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        chartData: data?.chart_data || null,
        lastUpdated: data?.updated_at || null
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "save" or "get"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('User charts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}