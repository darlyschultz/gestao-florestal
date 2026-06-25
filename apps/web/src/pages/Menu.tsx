import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Truck, Wrench, Zap, Bell, Map, Building2,
  BarChart2, FileBarChart, LogOut, ChevronRight, User, Clock, Package,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { useResponsiveLayout } from '../hooks/useResponsiveLayout'

interface MenuItem {
  title: string
  description: string
  icon: React.ReactNode
  to: string
  color: string
  bg: string
  perfis?: string[]
  badge?: string
}

const PERFIL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  transportador: 'Transportador',
  motorista: 'Motorista',
  portaria: 'Portaria',
  operacao: 'Operação',
  operador_area: 'Operador de Área',
  gestor: 'Gestor',
}

const menuItems: MenuItem[] = [
  {
    title: 'Carregamento',
    description: 'Fila de veículos no pátio da fazenda',
    icon: <Package size={24} />,
    to: '/area/carregamento',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    perfis: ['operador_area'],
  },
  {
    title: 'Reservar Horário',
    description: 'Escolha dia e horários de saída',
    icon: <Calendar size={24} />,
    to: '/agendamento/calendario',
    color: 'text-forest-700',
    bg: 'bg-forest-100',
    perfis: ['motorista'],
  },
  {
    title: 'Meus Horários',
    description: 'Pré-agendamentos e pendências',
    icon: <Clock size={24} />,
    to: '/agendamento/meus',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    perfis: ['motorista'],
  },
  {
    title: 'Minhas Viagens',
    description: 'Acompanhe suas entregas em andamento',
    icon: <Truck size={24} />,
    to: '/viagens',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    perfis: ['motorista'],
  },
  {
    title: 'Meu Perfil',
    description: 'Dados pessoais e senha de acesso',
    icon: <User size={24} />,
    to: '/perfil',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    perfis: ['motorista'],
  },
  {
    title: 'Agendamento de Transporte',
    description: 'Reserve horários e complete depois',
    icon: <Calendar size={24} />,
    to: '/agendamento/calendario',
    color: 'text-forest-700',
    bg: 'bg-forest-100',
    perfis: ['admin', 'transportador'],
  },
  {
    title: 'Meus Agendamentos',
    description: 'Pré-agendamentos e pendências',
    icon: <Clock size={24} />,
    to: '/agendamento/meus',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    perfis: ['admin', 'transportador'],
  },
  {
    title: 'Entrega de Madeira',
    description: 'Acompanhe todas as viagens',
    icon: <Truck size={24} />,
    to: '/viagens',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    perfis: ['admin', 'transportador', 'portaria', 'operacao', 'gestor'],
  },
  {
    title: 'Rastreamento',
    description: 'Mapa da frota em trânsito',
    icon: <Map size={24} />,
    to: '/mapa',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    perfis: ['admin', 'transportador', 'portaria', 'operacao', 'gestor'],
  },
  {
    title: 'Portaria',
    description: 'Check-in e liberação de veículos',
    icon: <Building2 size={24} />,
    to: '/portaria',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    perfis: ['admin', 'portaria'],
  },
  {
    title: 'Fila / Pátio',
    description: 'Controle de espera',
    icon: <Truck size={24} />,
    to: '/fila-patio',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    perfis: ['admin', 'portaria', 'operacao'],
  },
  {
    title: 'Manutenção',
    description: 'Ordens de serviço',
    icon: <Wrench size={24} />,
    to: '/manutencao',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    badge: 'Em breve',
    perfis: ['admin', 'transportador', 'portaria', 'operacao', 'gestor'],
  },
  {
    title: 'Vistoria Eletromecânica',
    description: 'Inspeções veiculares',
    icon: <Zap size={24} />,
    to: '/vistoria',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    badge: 'Em breve',
    perfis: ['admin', 'transportador', 'portaria', 'operacao', 'gestor'],
  },
  {
    title: 'Alerta',
    description: 'Notificações e pendências',
    icon: <Bell size={24} />,
    to: '/alertas',
    color: 'text-red-700',
    bg: 'bg-red-100',
    badge: '3',
    perfis: ['admin', 'transportador', 'portaria', 'operacao', 'gestor'],
  },
  {
    title: 'Dashboard',
    description: 'Painel operacional',
    icon: <BarChart2 size={24} />,
    to: '/dashboard',
    color: 'text-indigo-700',
    bg: 'bg-indigo-100',
    perfis: ['admin', 'operacao'],
  },
  {
    title: 'Relatórios',
    description: 'Indicadores e análises',
    icon: <FileBarChart size={24} />,
    to: '/relatorios',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    perfis: ['admin', 'operacao', 'gestor'],
  },
  {
    title: 'Cadastros',
    description: 'Gestão de dados base',
    icon: <Building2 size={24} />,
    to: '/cadastros',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    perfis: ['admin', 'gestor'],
  },
  {
    title: 'Configurações',
    description: 'Parâmetros do sistema',
    icon: <Wrench size={24} />,
    to: '/configuracoes',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    perfis: ['admin'],
  },
]

function MobileMenuHeader({
  user,
  onProfile,
  onLogout,
  isMotorista,
}: {
  user: { nome?: string; perfil?: string } | null
  onProfile: () => void
  onLogout: () => void
  isMotorista?: boolean
}) {
  return (
    <header className="lg:hidden bg-forest-800 text-white px-4 pt-8 pb-6 w-full">
      <div className="w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
                <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-forest-300 font-medium">Rastreamento Florestal</p>
              <h2 className="text-sm font-bold">{isMotorista ? 'Área do Motorista' : 'Menu Principal'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onProfile}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
          <p className="text-xs text-forest-300 mb-0.5">Bem-vindo de volta,</p>
          <p className="font-bold text-white">{user?.nome}</p>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
            {PERFIL_LABEL[user?.perfil || ''] || user?.perfil}
          </span>
        </div>
      </div>
    </header>
  )
}

function DesktopWelcomeBanner({ user }: { user: { nome?: string; perfil?: string } | null }) {
  return (
    <div className="hidden lg:block mb-8 rounded-2xl bg-gradient-to-r from-forest-800 to-forest-700 text-white p-6 xl:p-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-forest-300 text-sm font-medium mb-1">Bem-vindo de volta</p>
          <h2 className="text-2xl xl:text-3xl font-bold">{user?.nome}</h2>
          <span className="inline-block mt-2 text-xs bg-white/20 px-3 py-1 rounded-full">
            {PERFIL_LABEL[user?.perfil || ''] || user?.perfil}
          </span>
        </div>
        <div className="hidden xl:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center shrink-0">
          <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
            <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" />
          </svg>
        </div>
      </div>
      <p className="mt-4 text-forest-200 text-sm max-w-2xl">
        {user?.perfil === 'motorista'
          ? 'Reserve horários, complete seus dados e acompanhe suas viagens de entrega de madeira.'
          : user?.perfil === 'operador_area'
            ? 'Gerencie a fila de carregamento no pátio da fazenda — chegada, início e conclusão.'
            : 'Selecione um módulo abaixo para gerenciar transportes, viagens, portaria e operações florestais.'}
      </p>
    </div>
  )
}

export function Menu() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDesktop } = useResponsiveLayout()

  const visibleItems = menuItems.filter(
    (item) => !item.perfis || item.perfis.includes(user?.perfil || '')
  )

  return (
    <PageLayout
      title={
        user?.perfil === 'motorista'
          ? 'Área do Motorista'
          : user?.perfil === 'operador_area'
            ? 'Área de Carregamento'
            : 'Menu Principal'
      }
      subtitle={
        user?.perfil === 'motorista'
          ? 'Suas reservas e viagens'
          : user?.perfil === 'operador_area'
            ? 'Operações no local de embarque'
            : 'Selecione um módulo para continuar'
      }
      header={
        !isDesktop ? (
          <MobileMenuHeader
            user={user}
            onProfile={() => navigate('/perfil')}
            onLogout={logout}
            isMotorista={user?.perfil === 'motorista'}
          />
        ) : undefined
      }
    >
      <DesktopWelcomeBanner user={user} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
        {visibleItems.map((item) => (
          <Card
            key={item.to + item.title}
            hover
            padding="md"
            onClick={() => navigate(item.to)}
            className="group h-full"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg} shrink-0`}>
                <div className={item.color}>{item.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{item.title}</h3>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.badge === 'Em breve'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center lg:text-left">
        <p className="text-xs text-gray-400">Sistema de Rastreamento Florestal</p>
        <p className="text-xs text-gray-300">Versão 1.0.0</p>
      </div>
    </PageLayout>
  )
}
