import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar, Truck, User, MapPin, Package, Clock,
  FileText, ChevronRight, ArrowUpDown, Building2, TreePine,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Agendamento } from '../../types'
import { portariaService } from '../../services/api'
import { STATUS_PENDENTE_CHECKIN } from './portariaFiltros'

const PERIODOS = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Amanhã', value: 'amanha' },
  { label: '7 dias', value: 'semana' },
  { label: 'Todos', value: 'todos' },
]

const ORDENACOES = [
  { value: 'chegada', label: 'Chegada prevista' },
  { value: 'saida', label: 'Saída prevista' },
  { value: 'placa', label: 'Placa' },
  { value: 'numero', label: 'Número' },
]

interface AgendamentosPortariaProps {
  status: string
  search: string
  onSelecionar: (agendamento: Agendamento) => void
  onTotalChange?: (total: number) => void
  onLoadingChange?: (loading: boolean) => void
}

function docResumo(agendamento: Agendamento) {
  const docs = agendamento.viagem?.documentos || []
  if (docs.length === 0) return null
  const validos = docs.filter((d) => d.status === 'valido').length
  const pendentes = docs.filter((d) => d.status === 'pendente' || d.status === 'invalido').length
  return { total: docs.length, validos, pendentes }
}

export function AgendamentosPortaria({
  status,
  search,
  onSelecionar,
  onTotalChange,
  onLoadingChange,
}: AgendamentosPortariaProps) {
  const [periodo, setPeriodo] = useState('hoje')
  const [ordenar, setOrdenar] = useState('chegada')
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('asc')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const params: Record<string, string> = { ordenar, ordem, status }
      if (periodo !== 'todos') params.periodo = periodo
      if (search) params.q = search

      const r = await portariaService.listAgendamentos(params)
      setAgendamentos(r.data)
      onTotalChange?.(r.data.length)
    } catch {
      setAgendamentos([])
      onTotalChange?.(0)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }, [periodo, status, search, ordenar, ordem, onTotalChange, onLoadingChange])

  useEffect(() => {
    carregar()
  }, [carregar])

  function toggleOrdem() {
    setOrdem((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  return (
    <div className="space-y-4">
      {/* Filtros rápidos de data */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Período</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriodo(p.value)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                periodo === p.value
                  ? 'bg-purple-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ordenação */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Select
            label="Ordenar por"
            options={ORDENACOES}
            value={ordenar}
            onChange={(e) => setOrdenar(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={toggleOrdem}
          title={ordem === 'asc' ? 'Crescente' : 'Decrescente'}
          className="shrink-0 mb-0.5 p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 transition-colors"
        >
          <ArrowUpDown size={18} className={ordem === 'desc' ? 'rotate-180' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhum agendamento encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou o termo de busca</p>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {agendamentos.map((ag) => {
            const docs = docResumo(ag)
            const statusExibir = ag.viagem?.status || ag.status
            const aguardandoCheckin =
              !!ag.viagem && STATUS_PENDENTE_CHECKIN.includes(ag.viagem.status)

            return (
              <Card
                key={ag.id}
                hover={aguardandoCheckin}
                onClick={() => aguardandoCheckin && onSelecionar(ag)}
                className={`group ${aguardandoCheckin ? 'cursor-pointer ring-1 ring-amber-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{ag.numero}</p>
                    {ag.viagem && (
                      <p className="text-xs text-purple-600 font-medium">{ag.viagem.numero}</p>
                    )}
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      {ag.veiculo?.placa || '—'}
                      {ag.veiculo?.placaCarreta && (
                        <span className="text-sm font-semibold text-gray-500 ml-1.5">
                          / {ag.veiculo.placaCarreta}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{ag.veiculo?.tipo}</p>
                  </div>
                  <StatusBadge status={statusExibir} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                      <Clock size={10} /> Saída prev.
                    </p>
                    <p className="text-xs font-semibold text-gray-800">
                      {format(new Date(ag.dataHoraSaidaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <p className="text-[10px] text-purple-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                      <Clock size={10} /> Chegada prev.
                    </p>
                    <p className="text-xs font-semibold text-purple-900">
                      {format(new Date(ag.dataHoraChegadaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-2">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      <span className="font-medium text-gray-800">{ag.motorista?.nome}</span>
                      {ag.motorista?.telefone && (
                        <span className="text-gray-400 ml-1">· {ag.motorista.telefone}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate font-medium text-gray-800">{ag.transportadora?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{ag.fornecedor?.nome || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {ag.fazenda?.nome}
                      {ag.fazenda?.cidade && ` — ${ag.fazenda.cidade}/${ag.fazenda.estado}`}
                      {ag.talhao?.nome && ` · ${ag.talhao.nome}`}
                      {ag.localEmbarque?.nome && ` · ${ag.localEmbarque.nome}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TreePine size={12} className="text-gray-400 shrink-0" />
                    <span>
                      {ag.tipoMadeira} · <strong>{ag.quantidadePrevistaM3} m³</strong>
                    </span>
                  </div>
                  {docs && (
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-gray-400 shrink-0" />
                      <span>
                        Documentos: {docs.validos}/{docs.total} validados
                        {docs.pendentes > 0 && (
                          <span className="text-amber-600 font-medium ml-1">
                            ({docs.pendentes} pendente{docs.pendentes !== 1 ? 's' : ''})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {ag.observacoes && (
                    <div className="flex items-start gap-2">
                      <Package size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-500 italic">{ag.observacoes}</span>
                    </div>
                  )}
                </div>

                {aguardandoCheckin && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                      Check-in pendente
                    </span>
                    <span className="text-xs text-purple-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Fazer check-in
                      <ChevronRight size={14} />
                    </span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
