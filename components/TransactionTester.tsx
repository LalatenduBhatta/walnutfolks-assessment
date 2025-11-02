// components/TransactionTester.tsx
'use client'

import { useState } from 'react'
import { generateTransactionId } from '@/lib/utils'

export default function TransactionTester() {
  const [transactionId, setTransactionId] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testWebhook = async () => {
    setIsLoading(true)
    setStatus('Sending webhook...')
    
    const testTransactionId = transactionId || generateTransactionId()
    
    try {
      const response = await fetch('/api/v1/webhooks/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: testTransactionId,
          source_account: 'acc_user_' + Math.random().toString(36).substr(2, 8),
          destination_account: 'acc_merchant_' + Math.random().toString(36).substr(2, 8),
          amount: Math.floor(Math.random() * 1000) + 100,
          currency: 'INR'
        })
      })

      if (response.status === 202) {
        setStatus(`✅ Webhook accepted! Transaction ID: ${testTransactionId}`)
        setTransactionId(testTransactionId)
        
        // Check status after a delay
        setTimeout(() => checkTransactionStatus(testTransactionId), 2000)
      } else {
        const error = await response.text()
        setStatus(`❌ Error: ${response.status} - ${error}`)
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkTransactionStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/transactions/${id}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(`📊 Status: ${data.status} | Created: ${new Date(data.created_at).toLocaleTimeString()}${data.processed_at ? ` | Processed: ${new Date(data.processed_at).toLocaleTimeString()}` : ''}`)
      } else {
        setStatus('❌ Could not fetch transaction status')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  const handleCheckStatus = async () => {
    if (!transactionId) return
    setIsLoading(true)
    await checkTransactionStatus(transactionId)
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transaction Webhook Tester</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID (leave empty for auto-generation)
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="txn_abc123..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={testWebhook}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Test Webhook'}
          </button>
          
          <button
            onClick={handleCheckStatus}
            disabled={!transactionId || isLoading}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Check Status
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
            status.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {status}
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p>💡 <strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Webhook returns 202 Accepted immediately</li>
            <li>Transaction processes in background for 30 seconds</li>
            <li>Check status to see processing progress</li>
            <li>Duplicate transaction IDs are handled gracefully</li>
          </ul>
        </div>
      </div>
    </div>
  )
}