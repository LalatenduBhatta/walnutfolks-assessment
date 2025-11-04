// components/CallAnalyticsCharts.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
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
import type { PieLabelRenderProps } from 'recharts'
import { Edit2, Save, X } from 'lucide-react'
import EmailModal from './EmailModal'
import { ChartData } from '@/types'

// Soft pastel colors matching the image
const SOFT_COLORS = [
  '#B8D4E8', // Light blue
  '#A8C9E0', // Medium light blue
  '#7BA5C8', // Medium blue
  '#5B8FB0', // Deeper blue
  '#4A7A98', // Dark blue
  '#9AC5A5', // Light green
  '#D4E8D8', // Very light blue-green
]

const initialData: ChartData = {
  callDuration: [
    { name: '0-1 min', duration: 45 },
    { name: '1-3 min', duration: 120 },
    { name: '3-5 min', duration: 180 },
    { name: '5-10 min', duration: 95 },
    { name: '10-15 min', duration: 45 },
    { name: '15+ min', duration: 25 }
  ],
  sadPath: [
    { name: 'User refused to confirm identity', value: 25 },
    { name: 'Caller identification', value: 20 },
    { name: 'Incorrect caller identity', value: 15 },
    { name: 'Assistant did not speak Spanish', value: 12 },
    { name: 'Unsupported Language', value: 10 },
    { name: 'Assistant did not speak French', value: 8 },
    { name: 'Customer Hostility', value: 6 },
    { name: 'Verbal Aggression', value: 4 }
  ]
}

// Custom label for donut chart with lines pointing outward
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    outerRadius = 0,
    name = '',
    percent = 0
  } = props

  // Convert to numbers
  const numericCx = typeof cx === 'number' ? cx : 0
  const numericCy = typeof cy === 'number' ? cy : 0
  const numericMidAngle = typeof midAngle === 'number' ? midAngle : 0
  const numericOuterRadius = typeof outerRadius === 'number' ? outerRadius : 0
  const numericPercent = typeof percent === 'number' ? percent : 0
  
  const RADIAN = Math.PI / 180
  
  // Calculate position for the line and label
  const radius = numericOuterRadius + 30
  const x = numericCx + radius * Math.cos(-numericMidAngle * RADIAN)
  const y = numericCy + radius * Math.sin(-numericMidAngle * RADIAN)
  
  const lineX = numericCx + (numericOuterRadius + 10) * Math.cos(-numericMidAngle * RADIAN)
  const lineY = numericCy + (numericOuterRadius + 10) * Math.sin(-numericMidAngle * RADIAN)
  
  if (numericPercent < 0.03) return null

  return (
    <g>
      <line
        x1={lineX}
        y1={lineY}
        x2={x}
        y2={y}
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text
        x={x}
        y={y}
        fill="#6B7280"
        textAnchor={x > numericCx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
      >
        {String(name)}
      </text>
    </g>
  )
}

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Call Analytics Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced voice agent performance metrics and call analysis
          </p>
          {email && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-green-800 text-sm">Logged in as: {email}</span>
            </div>
          )}
        </header>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Call Duration Analysis - Area Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-700">Call Duration Analysis</h2>
                <p className="text-gray-500 mt-1">Distribution of call lengths</p>
              </div>
              <button
                onClick={() => startEditing('callDuration')}
                className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2 text-sm"
              >
                <Edit2 size={16} />
                <span>Edit Values</span>
              </button>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData.callDuration} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7BA5C8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#B8D4E8" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    label={{ 
                      value: 'Call Count', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#6B7280', fontSize: 12 }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} calls`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#5B8FB0"
                    strokeWidth={2}
                    fill="url(#colorDuration)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sad Path Analysis - Donut Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-700">Sad Path Analysis</h2>
                <p className="text-gray-500 mt-1">Common failure reasons</p>
              </div>
              <button
                onClick={() => startEditing('sadPath')}
                className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2 text-sm"
              >
                <Edit2 size={16} />
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
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.sadPath.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SOFT_COLORS[index % SOFT_COLORS.length]} 
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} occurrences`, name]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Analytics Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Performance Trends</h2>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#5B8FB0" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#9AC5A5" 
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit {editingChart === 'callDuration' ? 'Call Duration' : 'Sad Path'} Values
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {tempData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {item.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={getValue(item) || 0}
                        onChange={(e) => updateTempValue(index, parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                      <span className="text-sm text-gray-500 w-12">
                        {editingChart === 'callDuration' ? 'calls' : 'count'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChartData}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
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