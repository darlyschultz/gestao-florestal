import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = 'Rastreamento Florestal', subtitle }: HeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="hidden lg:flex items-center justify-between px-6 xl:px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center text-forest-700 font-semibold text-sm">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden xl:block">{user?.nome}</span>
          <User size={16} className="text-gray-400 xl:hidden" />
        </button>
      </div>
    </header>
  )
}
