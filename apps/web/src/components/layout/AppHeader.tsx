import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface AppHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backPath?: string
  rightContent?: React.ReactNode
  showNotification?: boolean
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backPath,
  rightContent,
  showNotification = false,
}: AppHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  function handleBack() {
    if (backPath) navigate(backPath)
    else navigate(-1)
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40 w-full">
      <div className="flex items-center gap-3 w-full">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {rightContent}
          {showNotification && (
            <button className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// Logo component
export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} bg-forest-700 rounded-2xl flex items-center justify-center shadow-lg`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Árvore estilizada */}
          <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" opacity="0.9" />
        </svg>
      </div>
    </div>
  )
}
