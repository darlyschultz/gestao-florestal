import React from 'react'
import { Search, Filter } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { STATUS_FILTROS } from './portariaFiltros'

interface FiltroPrincipalPortariaProps {
  status: string
  onStatusChange: (status: string) => void
  search: string
  onSearchChange: (search: string) => void
  total?: number
  loading?: boolean
  showBuscar?: boolean
  onBuscar?: () => void
  buscarLoading?: boolean
}

export function FiltroPrincipalPortaria({
  status,
  onStatusChange,
  search,
  onSearchChange,
  total,
  loading,
  showBuscar,
  onBuscar,
  buscarLoading,
}: FiltroPrincipalPortariaProps) {
  const statusAtivo = STATUS_FILTROS.find((s) => s.value === status)

  return (
    <Card className="mb-4 border-purple-100 bg-gradient-to-br from-white to-purple-50/40">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Filtro principal</h3>
            <p className="text-xs text-gray-500">
              {loading
                ? 'Carregando agendamentos...'
                : total != null
                  ? `${total} agendamento${total !== 1 ? 's' : ''} · ${statusAtivo?.label ?? status}`
                  : statusAtivo?.label ?? 'Selecione o status'}
            </p>
          </div>
        </div>
        {status === 'pendente_checkin' && (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
            Prioridade
          </span>
        )}
      </div>

      <div className="mb-3">
        <Select
          label="Status"
          options={STATUS_FILTROS.map((s) => ({ value: s.value, label: s.label }))}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Placa, NF, número do agendamento ou motorista..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
          onKeyDown={(e) => e.key === 'Enter' && showBuscar && onBuscar?.()}
          className="flex-1"
        />
        {showBuscar && (
          <Button
            onClick={onBuscar}
            loading={buscarLoading}
            icon={<Search size={16} />}
            className="shrink-0 self-end"
          >
            Buscar
          </Button>
        )}
      </div>
    </Card>
  )
}
