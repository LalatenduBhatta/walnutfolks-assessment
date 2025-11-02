// app/page.tsx
'use client'

import { useState } from 'react'
import CallAnalyticsCharts from '@/components/CallAnalyticsCharts'
import TransactionTester from '@/components/TransactionTester'

type ActiveTab = 'dashboard' | 'backend'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WalnutFolks Assessment</h1>
                <p className="text-sm text-gray-500">Full Stack Developer</p>
              </div>
            </div>
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Analytics Dashboard
              </button>
              <button
                onClick={() => setActiveTab('backend')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'backend'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚙️ Backend Tester
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' ? (
          <CallAnalyticsCharts />
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Backend API Testing</h1>
              <p className="text-gray-600">Test the transaction webhook system and background processing</p>
            </div>
            <TransactionTester />
            
            {/* API Documentation */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">API Documentation</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">POST /api/v1/webhooks/transactions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-800">{`{
  "transaction_id": "string (required)",
  "source_account": "string (required)",
  "destination_account": "string (required)",
  "amount": "number (required)",
  "currency": "string (optional, default: INR)"
}`}</pre>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Response:</strong> 202 Accepted (immediate), processes in background for 30 seconds
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">GET /api/v1/transactions/[transaction_id]</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Response:</strong> Transaction status and details
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">GET /api</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Response:</strong> Health check status
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}