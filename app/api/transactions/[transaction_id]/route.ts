// app/api/v1/transactions/[transaction_id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/superbase'

interface RouteParams {
  params: {
    transaction_id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const transactionId = params.transaction_id

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching transaction:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Convert amount back from cents to main unit
    const responseData = {
      transaction_id: transaction.transaction_id,
      source_account: transaction.source_account,
      destination_account: transaction.destination_account,
      amount: transaction.amount / 100, // Convert back from cents
      currency: transaction.currency,
      status: transaction.status,
      created_at: transaction.created_at,
      processed_at: transaction.processed_at,
      updated_at: transaction.updated_at
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}// app/api/v1/transactions/[transaction_id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: {
    transaction_id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const transactionId = params.transaction_id

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching transaction:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Convert amount back from cents to main unit
    const responseData = {
      transaction_id: transaction.transaction_id,
      source_account: transaction.source_account,
      destination_account: transaction.destination_account,
      amount: transaction.amount / 100, // Convert back from cents
      currency: transaction.currency,
      status: transaction.status,
      created_at: transaction.created_at,
      processed_at: transaction.processed_at,
      updated_at: transaction.updated_at
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}