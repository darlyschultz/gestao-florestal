import React, { useState, useEffect } from 'react'
import { List, SearchCheck } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { AgendamentosPortaria } from './AgendamentosPortaria'
import { CheckinPortaria } from './CheckinPortaria'
import { FiltroPrincipalPortaria } from './FiltroPrincipalPortaria'
import { STATUS_FILTRO_PADRAO } from './portariaFiltros'
import { Agendamento } from '../../types'

type Tab = 'agendamentos' | 'checkin'

export function PortariaPage() {
  const [tab, setTab] = useState<Tab>('agendamentos')
  const [status, setStatus] = useState(STATUS_FILTRO_PADRAO)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalAgendamentos, setTotalAgendamentos] = useState<number>()
  const [loadingLista, setLoadingLista] = useState(true)
  const [checkinQuery, setCheckinQuery] = useState('')
  const [checkinKey, setCheckinKey] = useState(0)
  const [checkinSearching, setCheckinSearching] = useState(false)
  const [triggerCheckinSearch, setTriggerCheckinSearch] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  function handleSelecionarAgendamento(ag: Agendamento) {
    const termo =
      ag.viagem?.numero ||
      ag.numero ||
      ag.veiculo?.placa ||
      ''
    setSearch(termo)
    setCheckinQuery(termo)
    setCheckinKey((k) => k + 1)
    setTab('checkin')
  }

  return (
    <PageLayout
      header={
        <AppHeader title="Portaria" subtitle="Agendamentos e check-in de veículos" showBack backPath="/menu" />
      }
    >
      <FiltroPrincipalPortaria
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        total={totalAgendamentos}
        loading={tab === 'agendamentos' && loadingLista}
        showBuscar={tab === 'checkin'}
        onBuscar={() => setTriggerCheckinSearch((n) => n + 1)}
        buscarLoading={checkinSearching}
      />

      {/* Abas */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-4">
        <button
          type="button"
          onClick={() => setTab('agendamentos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'agendamentos'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={16} />
          Agendamentos
        </button>
        <button
          type="button"
          onClick={() => setTab('checkin')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'checkin'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <SearchCheck size={16} />
          Check-in
        </button>
      </div>

      {tab === 'agendamentos' ? (
        <AgendamentosPortaria
          status={status}
          search={debouncedSearch}
          onSelecionar={handleSelecionarAgendamento}
          onTotalChange={setTotalAgendamentos}
          onLoadingChange={setLoadingLista}
        />
      ) : (
        <CheckinPortaria
          key={checkinKey}
          embedded
          query={search}
          searchTrigger={triggerCheckinSearch}
          autoSearch={!!checkinQuery}
          onSearchingChange={setCheckinSearching}
        />
      )}
    </PageLayout>
  )
}
