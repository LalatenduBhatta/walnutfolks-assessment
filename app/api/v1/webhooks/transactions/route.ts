// app/api/v1/webhooks/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/superbase'

// In-memory store for tracking processing transactions (for idempotency)
const processingTransactions = new Set<string>()

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    console.log('Received webhook:', body)
    
    const {
      transaction_id,
      source_account,
      destination_account,
      amount,
      currency = 'INR'
    } = body

    // Validate required fields
    if (!transaction_id || !source_account || !destination_account || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: transaction_id, source_account, destination_account, amount are required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Check if already processing (in-memory check for immediate duplicates)
    if (processingTransactions.has(transaction_id)) {
      console.log(`Transaction ${transaction_id} is already being processed`)
      return new NextResponse(null, { status: 202 })
    }

    // Check database for existing transaction
    const { data: existingTransaction, error: queryError } = await supabase
      .from('transactions')
      .select('transaction_id, status')
      .eq('transaction_id', transaction_id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Database query error:', queryError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingTransaction) {
      console.log(`Transaction ${transaction_id} already exists with status: ${existingTransaction.status}`)
      return new NextResponse(null, { status: 202 })
    }

    // Add to processing set
    processingTransactions.add(transaction_id)

    // Insert transaction with PROCESSING status
    const transactionData = {
      transaction_id,
      source_account,
      destination_account,
      amount: Math.round(amount * 100), // Store in cents/paisa
      currency,
      status: 'PROCESSING' as const,
      created_at: new Date().toISOString(),
      processed_at: null
    }

    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionData)

    if (insertError) {
      console.error('Error inserting transaction:', insertError)
      processingTransactions.delete(transaction_id)
      return NextResponse.json(
        { error: 'Failed to process transaction' },
        { status: 500 }
      )
    }

    console.log(`Transaction ${transaction_id} inserted successfully, starting background processing`)

    // Start background processing (non-blocking)
    processTransactionInBackground(transaction_id)

    const processingTime = Date.now() - startTime
    console.log(`Webhook processed in ${processingTime}ms`)

    // Return 202 Accepted as required
    return new NextResponse(JSON.stringify({ 
      acknowledged: true,
      transaction_id,
      status: 'processing'
    }), {
      status: 202,
      headers: {
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        processing_time: `${processingTime}ms`
      },
      { status: 500 }
    )
  }
}

async function processTransactionInBackground(transactionId: string) {
  console.log(`Starting background processing for transaction: ${transactionId}`)
  
  try {
    // Simulate 30-second delay for external API calls
    await new Promise(resolve => setTimeout(resolve, 30000))

    console.log(`Completing processing for transaction: ${transactionId}`)

    // Update transaction status to PROCESSED
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'PROCESSED',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId)

    if (error) {
      console.error('Error updating transaction status:', error)
      throw error
    }

    console.log(`Transaction ${transactionId} processed successfully`)

  } catch (error) {
    console.error('Background processing error:', error)
    
    // Update transaction with error status (you might want to implement retry logic)
    await supabase
      .from('transactions')
      .update({
        status: 'PROCESSING', // Keep as processing for retry, or create FAILED status
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId)
      
  } finally {
    // Remove from processing set
    processingTransactions.delete(transactionId)
  }
}

// Optional: Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}