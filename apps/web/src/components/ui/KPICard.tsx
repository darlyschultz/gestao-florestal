import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from './Card'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label?: string }
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'orange'
  loading?: boolean
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'text-green-600', badge: 'bg-green-100 text-green-800' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
}

export function KPICard({ title, value, subtitle, icon, trend, color = 'green', loading }: KPICardProps) {
  const colors = colorMap[color]

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
              {trend.value > 0 ? (
                <TrendingUp size={11} />
              ) : trend.value < 0 ? (
                <TrendingDown size={11} />
              ) : (
                <Minus size={11} />
              )}
              {Math.abs(trend.value)}% {trend.label || ''}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </Card>
  )
}
