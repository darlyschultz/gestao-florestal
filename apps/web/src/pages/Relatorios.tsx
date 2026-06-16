import React, { useState } from 'react'
import { BarChart2, Filter, Download, TrendingUp, Clock, Truck, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PageLayout } from '../components/layout/PageLayout'
import { AppHeader } from '../components/layout/AppHeader'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { KPICard } from '../components/ui/KPICard'

const RANKING_MOCK = [
  { nome: 'TransFloresta Ltda', volume: 4650, percent: 27.6 },
  { nome: 'LogFlorestal', volume: 3890, percent: 23.1 },
  { nome: 'Florestal Prime', volume: 3210, percent: 19.1 },
  { nome: 'Estrada Verde', volume: 2480, percent: 14.7 },
  { nome: 'Florestal Prime', volume: 2350, percent: 14.5 },
]

const VOL_FAZENDA = [
  { fazenda: 'Faz. Boa Vista', volume: 5200 },
  { fazenda: 'Faz. Santa Nélia', volume: 3800 },
  { fazenda: 'Faz. São Pedro', volume: 2900 },
  { fazenda: 'Faz. Cerrado', volume: 2100 },
]

export function Relatorios() {
  const [periodo, setPeriodo] = useState('semana')
  const [transportadora, setTransportadora] = useState('')
  const [fazenda, setFazenda] = useState('')

  return (
    <PageLayout
      header={
        <AppHeader
          title="Relatórios e Indicadores"
          subtitle="Análise operacional"
          showBack
          backPath="/menu"
          rightContent={
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <Download size={18} />
            </button>
          }
        />
      }
    >
      <div className="space-y-5 pb-4">
        {/* Filtros */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              options={[
                { value: 'hoje', label: 'Hoje' },
                { value: 'semana', label: 'Esta semana' },
                { value: 'mes', label: 'Este mês' },
                { value: 'trimestre', label: 'Trimestre' },
              ]}
            />
            <Select
              label="Transportadora"
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              placeholder="Todas"
              options={[
                { value: '1', label: 'TransFloresta Ltda' },
                { value: '2', label: 'LogFlorestal' },
                { value: '3', label: 'Florestal Prime' },
              ]}
            />
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            title="Tempo Médio Viagem"
            value="2h 48min"
            subtitle="-15min vs. período ant."
            icon={<Clock size={20} />}
            color="green"
          />
          <KPICard
            title="Tempo Médio Portaria"
            value="32 min"
            subtitle="+5min vs. período ant."
            icon={<TrendingUp size={20} />}
            color="yellow"
          />
          <KPICard
            title="Volume Recebido"
            value="12.480 m³"
            icon={<Truck size={20} />}
            color="blue"
            trend={{ value: 7, label: 'crescimento' }}
          />
          <KPICard
            title="Divergências"
            value="1,6%"
            subtitle="Fora da tolerância"
            icon={<AlertTriangle size={20} />}
            color="red"
          />
        </div>

        {/* Ranking transportadoras */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ranking de Transportadoras</h3>
          <div className="space-y-3">
            {RANKING_MOCK.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-forest-700">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.nome}</p>
                    <p className="text-xs font-bold text-gray-600 shrink-0 ml-2">{item.volume.toLocaleString('pt-BR')} m³</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-forest-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 w-10 text-right">{item.percent}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Volume por fazenda */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume por Fazenda/Talhão</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={VOL_FAZENDA} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="fazenda"
                tick={{ fontSize: 10 }}
                width={90}
                tickFormatter={(v) => v.replace('Faz. ', '')}
              />
              <Tooltip formatter={(v) => [`${v} m³`, 'Volume']} />
              <Bar dataKey="volume" fill="#1a5940" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Alertas fora tolerância */}
        <Card className="border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Caminhões com Divergência Fora da Tolerância</h3>
          </div>
          <div className="space-y-2">
            {[
              { placa: 'XYN8787', divergencia: '-8.3%', motorista: 'João Carlos', fazenda: 'Faz. Boa Vista' },
              { placa: 'ZKW3344', divergencia: '+6.1%', motorista: 'Marcos A.', fazenda: 'Faz. Santa Nélia' },
            ].map((item) => (
              <div key={item.placa} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.placa}</p>
                  <p className="text-xs text-gray-500">{item.motorista} · {item.fazenda}</p>
                </div>
                <span className="text-sm font-bold text-red-600">{item.divergencia}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
