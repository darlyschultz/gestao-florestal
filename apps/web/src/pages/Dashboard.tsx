import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Clock, Package, CheckCircle, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { PageLayout } from '../components/layout/PageLayout'
import { AppHeader } from '../components/layout/AppHeader'
import { KPICard } from '../components/ui/KPICard'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { dashboardService } from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MOCK_DATA = {
  cards: {
    emTransito: 12,
    emFila: 23,
    emDescarga: 18,
    finalizadosHoje: 76,
    atrasados: 7,
    alertasCriticos: 2,
  },
  chegadasPorHora: [
    { hora: 6, total: 3 },
    { hora: 7, total: 5 },
    { hora: 8, total: 8 },
    { hora: 9, total: 12 },
    { hora: 10, total: 15 },
    { hora: 11, total: 10 },
    { hora: 12, total: 7 },
    { hora: 13, total: 9 },
    { hora: 14, total: 11 },
    { hora: 15, total: 8 },
    { hora: 16, total: 6 },
    { hora: 17, total: 4 },
  ],
  chegadasHoje: [
    { id: '1', numero: 'VGM-2024-0012', status: 'em_descarga', veiculo: { placa: 'ABC1023' }, motorista: { nome: 'João Carlos' }, agendamento: { transportadora: { nome: 'TransFloresta Ltda' }, fazenda: { nome: 'Faz. Boa Vista' } } },
    { id: '2', numero: 'VGM-2024-0013', status: 'em_pesagem', veiculo: { placa: 'CHE3634' }, motorista: { nome: 'Paulo H.' }, agendamento: { transportadora: { nome: 'LogFlorestal' }, fazenda: { nome: 'Faz. São Pedro' } } },
    { id: '3', numero: 'VGM-2024-0014', status: 'portaria', veiculo: { placa: 'DEF4556' }, motorista: { nome: 'Marcos A.' }, agendamento: { transportadora: { nome: 'TransFloresta Ltda' }, fazenda: { nome: 'Faz. Santa Nélia' } } },
    { id: '4', numero: 'VGM-2024-0015', status: 'finalizado', veiculo: { placa: 'INM4696' }, motorista: { nome: 'Roberto S.' }, agendamento: { transportadora: { nome: 'Florestal Prime' }, fazenda: { nome: 'Faz. São Pedro' } } },
    { id: '5', numero: 'VGM-2024-0016', status: 'em_descarga', veiculo: { placa: 'PHQ2023' }, motorista: { nome: 'Rodrigo M.' }, agendamento: { transportadora: { nome: 'LogFlorestal' }, fazenda: { nome: 'Faz. Boa Vista' } } },
  ],
}

const STATUS_PIE_DATA = [
  { name: 'Em trânsito', value: 12, color: '#237254' },
  { name: 'Em fila', value: 23, color: '#f5a623' },
  { name: 'Em descarga', value: 18, color: '#3b82f6' },
  { name: 'Finalizados', value: 76, color: '#10b981' },
  { name: 'Atrasados', value: 7, color: '#ef4444' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(MOCK_DATA)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dashboardService.operacional()
      .then((r) => setData(r.data))
      .catch(() => {}) // usa mock
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout
      header={
        <AppHeader
          title="Dashboard Operacional"
          subtitle={format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          showBack
          backPath="/menu"
          showNotification
        />
      }
    >
      <div className="space-y-5 pb-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            title="Em Trânsito"
            value={data.cards.emTransito}
            icon={<Truck size={20} />}
            color="green"
            trend={{ value: 8, label: 'vs ontem' }}
          />
          <KPICard
            title="Em Fila"
            value={data.cards.emFila}
            icon={<Clock size={20} />}
            color="yellow"
          />
          <KPICard
            title="Em Descarga"
            value={data.cards.emDescarga}
            icon={<Package size={20} />}
            color="blue"
          />
          <KPICard
            title="Finalizados Hoje"
            value={data.cards.finalizadosHoje}
            icon={<CheckCircle size={20} />}
            color="green"
            trend={{ value: 12, label: 'vs ontem' }}
          />
          <KPICard
            title="Atrasados"
            value={data.cards.atrasados}
            icon={<TrendingUp size={20} />}
            color="red"
          />
          <KPICard
            title="Alertas Críticos"
            value={data.cards.alertasCriticos}
            icon={<AlertTriangle size={20} />}
            color="red"
          />
        </div>

        {/* Chegadas por hora */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Chegadas por Hora</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.chegadasPorHora} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} chegadas`, 'Total']} labelFormatter={(l) => `${l}:00`} />
              <Bar dataKey="total" fill="#237254" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status operações */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status das Operações</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={140}>
              <PieChart>
                <Pie data={STATUS_PIE_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                  {STATUS_PIE_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {STATUS_PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Lista chegadas do dia */}
        <Card padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Chegadas do Dia</h3>
            <button
              onClick={() => navigate('/viagens')}
              className="text-xs text-forest-600 font-medium"
            >
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data.chegadasHoje.map((v: any) => (
              <div
                key={v.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/viagens/${v.id}`)}
              >
                <div className="w-8 h-8 bg-forest-100 rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={14} className="text-forest-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800">{v.veiculo?.placa}</p>
                  <p className="text-xs text-gray-500 truncate">{v.motorista?.nome} · {v.agendamento?.fazenda?.nome}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={v.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
