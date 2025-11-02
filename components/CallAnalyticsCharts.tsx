// components/CallAnalyticsCharts.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import EmailModal from './EmailModal'
import { ChartData } from '@/types'

const initialData: ChartData = {
  callDuration: [
    { name: 'Short (<2min)', duration: 45 },
    { name: 'Medium (2-5min)', duration: 30 },
    { name: 'Long (>5min)', duration: 25 }
  ],
  sadPath: [
    { name: 'Vertical Agression', value: 15 },
    { name: 'Customer Hostility', value: 25 },
    { name: 'Assistant did not speak French', value: 10 },
    { name: 'Unsupported Language', value: 8 },
    { name: 'Assistant did not speak Spanish', value: 12 },
    { name: 'User refused to confirm identity', value: 20 },
    { name: 'Incorrect caller identity', value: 10 }
  ]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

export default function CallAnalyticsCharts() {
  const [chartData, setChartData] = useState<ChartData>(initialData)
  const [isEditing, setIsEditing] = useState(false)
  const [editingChart, setEditingChart] = useState<'callDuration' | 'sadPath'>('callDuration')
  const [tempData, setTempData] = useState(initialData.callDuration)
  const [email, setEmail] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [existingUserData, setExistingUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      loadUserData(savedEmail)
    }
  }, [])

  const loadUserData = async (userEmail: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, action: 'get' })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.chartData) {
          setChartData(data.chartData)
          setExistingUserData(data.chartData)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (userEmail: string, existingData: any) => {
    setEmail(userEmail)
    localStorage.setItem('userEmail', userEmail)
    setShowEmailModal(false)
    
    if (existingData) {
      setChartData(existingData)
      setExistingUserData(existingData)
    } else {
      await loadUserData(userEmail)
    }
  }

  const startEditing = (chartType: 'callDuration' | 'sadPath') => {
    if (!email) {
      setShowEmailModal(true)
      return
    }
    
    setEditingChart(chartType)
    setTempData(chartData[chartType])
    setIsEditing(true)
  }

  const saveChartData = async () => {
    const updatedData = {
      ...chartData,
      [editingChart]: tempData
    }

    setChartData(updatedData)
    setIsEditing(false)

    // Save to Supabase
    if (email) {
      try {
        await fetch('/api/user-charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            chartData: updatedData,
            action: 'save'
          })
        })
      } catch (error) {
        console.error('Error saving chart data:', error)
        alert('Failed to save chart data. Please try again.')
      }
    }
  }

  const updateTempValue = (index: number, value: number) => {
    const newData = [...tempData]
    if (editingChart === 'callDuration') {
      newData[index] = { ...newData[index], duration: value }
    } else {
      newData[index] = { ...newData[index], value: value }
    }
    setTempData(newData)
  }

  const getValue = (item: any) => {
    return editingChart === 'callDuration' ? item.duration : item.value
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chart data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Call Analytics Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced voice agent performance metrics and call analysis
          </p>
          {email && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 text-sm">Logged in as: {email}</span>
            </div>
          )}
        </header>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Call Duration Analysis */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Call Duration Analysis</h2>
                <p className="text-gray-600 mt-1">Distribution of call lengths</p>
              </div>
              <button
                onClick={() => startEditing('callDuration')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Values</span>
              </button>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.callDuration} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Call Count', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -10,
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} calls`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="duration" 
                    name="Call Count"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.callDuration.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sad Path Analysis */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Sad Path Analysis</h2>
                <p className="text-gray-600 mt-1">Common failure reasons</p>
              </div>
              <button
                onClick={() => startEditing('sadPath')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Values</span>
              </button>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.sadPath}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.sadPath.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} occurrences`, name]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Analytics Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { name: 'Jan', calls: 400, resolved: 380 },
                  { name: 'Feb', calls: 300, resolved: 278 },
                  { name: 'Mar', calls: 200, resolved: 189 },
                  { name: 'Apr', calls: 278, resolved: 239 },
                  { name: 'May', calls: 189, resolved: 159 },
                  { name: 'Jun', calls: 239, resolved: 219 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Edit {editingChart === 'callDuration' ? 'Call Duration' : 'Sad Path'} Values
              </h3>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {tempData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {item.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={getValue(item)}
                        onChange={(e) => updateTempValue(index, parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                      <span className="text-sm text-gray-500 w-12">
                        {editingChart === 'callDuration' ? 'calls' : '%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChartData}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onEmailSubmit={handleEmailSubmit}
          existingData={existingUserData}
        />
      </div>
    </div>
  )
}