import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Calendar, Truck, MapPin, BarChart2, Building2,
  Settings, FileBarChart, LogOut, Clock,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  perfis?: string[]
}

const mainNav: NavItem[] = [
  { to: '/menu', icon: Home, label: 'Início' },
  { to: '/agendamento/calendario', icon: Calendar, label: 'Agendamento', perfis: ['admin', 'transportador'] },
  { to: '/agendamento/meus', icon: Clock, label: 'Meus Horários', perfis: ['admin', 'transportador', 'motorista'] },
  { to: '/viagens', icon: Truck, label: 'Viagens' },
  { to: '/portaria', icon: MapPin, label: 'Portaria', perfis: ['admin', 'portaria'] },
  { to: '/fila-patio', icon: Truck, label: 'Fila / Pátio', perfis: ['admin', 'portaria', 'operacao'] },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard', perfis: ['admin', 'operacao', 'gestor'] },
  { to: '/relatorios', icon: FileBarChart, label: 'Relatórios', perfis: ['admin', 'operacao', 'gestor'] },
]

const adminNav: NavItem[] = [
  { to: '/cadastros', icon: Building2, label: 'Cadastros', perfis: ['admin', 'gestor'] },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', perfis: ['admin'] },
]

function NavSection({ items }: { items: NavItem[] }) {
  const { user } = useAuth()
  const visible = items.filter((item) => !item.perfis || item.perfis.includes(user?.perfil || ''))

  return (
    <>
      {visible.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-forest-700 text-white'
                : 'text-gray-600 hover:bg-forest-50 hover:text-forest-800'
            }`
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 bg-white border-r border-gray-200 min-h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
              <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">Rastreamento Florestal</p>
            <p className="text-sm font-bold text-gray-900 truncate">Gestão Florestal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavSection items={mainNav} />
        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Administração</p>
          <NavSection items={adminNav} />
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 bg-forest-100 rounded-full flex items-center justify-center text-forest-700 font-bold text-sm">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.perfil}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
