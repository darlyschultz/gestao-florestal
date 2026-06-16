import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, Truck, MapPin, BarChart2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/menu', icon: Home, label: 'Início' },
  { to: '/agendamento/calendario', icon: Calendar, label: 'Agendar' },
  { to: '/viagens', icon: Truck, label: 'Viagens' },
  { to: '/portaria', icon: MapPin, label: 'Portaria' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
]

const portariaItems = [
  { to: '/menu', icon: Home, label: 'Início' },
  { to: '/portaria', icon: MapPin, label: 'Portaria' },
  { to: '/fila-patio', icon: Truck, label: 'Fila' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
]

export function BottomNavigation() {
  const { user } = useAuth()

  const items = user?.perfil === 'portaria' || user?.perfil === 'operacao'
    ? portariaItems
    : navItems

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex w-full">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-3 px-1 text-xs font-medium transition-colors ${
                isActive ? 'text-forest-700' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-forest-100' : ''}`}>
                  <Icon size={20} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
