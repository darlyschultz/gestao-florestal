import React, { useCallback, useEffect, useState } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Package, Truck, RefreshCw, MapPin, User, Clock, ChevronDown, ChevronUp,
  Building2, FileText, Phone, Search, Filter, X, History,
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { carregamentosService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { STATUS_LABELS } from '../../types'

interface DocumentoItem {
  tipo: string
  numero?: string | null
  status: string
}

interface EventoItem {
  id: string
  tipo: string
  descricao: string
  createdAt: string
  user?: { nome: string }
}

interface ViagemFila {
  id: string
  numero: string
  status: string
  updatedAt?: string
  motorista?: { id: string; nome: string; telefone?: string; cpf?: string }
  veiculo?: { placa: string; placaCarreta?: string; tipo?: string; marca?: string; modelo?: string }
  transportadora?: { id: string; nome: string; telefone?: string; cnpj?: string }
  documentos?: DocumentoItem[]
  eventos?: EventoItem[]
  agendamento?: {
    numero?: string
    tipoMadeira?: string
    quantidadePrevistaM3?: number
    dataHoraSaidaPrevista?: string
    dataHoraChegadaPrevista?: string
    observacoes?: string
    fornecedor?: { nome: string }
    fazenda?: { nome: string; cidade?: string; estado?: string; municipio?: string; uf?: string }
    talhao?: { nome: string; codigo?: string }
    localEmbarque?: { nome: string; latitude?: number; longitude?: number }
    documentos?: DocumentoItem[]
  }
}

interface ResumoCarregamento {
  total: number
  agendado: number
  aguardando_carregamento: number
  em_carregamento: number
  carregado: number
  fazenda?: { id: string; nome: string }
}

interface OpcoesFiltro {
  transportadoras: Array<{ id: string; nome: string }>
  motoristas: Array<{ id: string; nome: string }>
}

interface FiltrosState {
  placa: string
  motoristaId: string
  transportadoraId: string
  status: string
}

const DOC_LABELS: Record<string, string> = {
  nota_fiscal: 'Nota Fiscal',
  mdfe: 'MDF-e',
  ordem_carregamento: 'Ordem de carregamento',
  anexo: 'Anexo',
}

const STATUS_FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'aguardando_carregamento', label: 'Aguardando' },
  { value: 'em_carregamento', label: 'Carregando' },
  { value: 'carregado', label: 'Carregado' },
]

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}

function tempoNaFila(updatedAt?: string): string {
  if (!updatedAt) return '—'
  const min = differenceInMinutes(new Date(), new Date(updatedAt))
  if (min < 1) return 'Agora'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

function todosDocumentos(viagem: ViagemFila): DocumentoItem[] {
  const docs = [...(viagem.documentos || [])]
  for (const d of viagem.agendamento?.documentos || []) {
    if (!docs.some((x) => x.tipo === d.tipo && x.numero === d.numero)) docs.push(d)
  }
  return docs
}

function ViagemCard({
  viagem,
  expanded,
  onToggle,
  onAction,
  loadingId,
}: {
  viagem: ViagemFila
  expanded: boolean
  onToggle: () => void
  onAction: (id: string, acao: 'chegada' | 'iniciar' | 'concluir') => void
  loadingId: string | null
}) {
  const ag = viagem.agendamento
  const busy = loadingId === viagem.id
  const docs = todosDocumentos(viagem)
  const localidade =
    ag?.fazenda?.cidade && ag?.fazenda?.estado
      ? `${ag.fazenda.cidade}/${ag.fazenda.estado}`
      : ag?.fazenda?.municipio && ag?.fazenda?.uf
        ? `${ag.fazenda.municipio}/${ag.fazenda.uf}`
        : null

  return (
    <Card padding="md" className="overflow-hidden">
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-gray-900">{viagem.numero}</p>
              <StatusBadge status={viagem.status} size="sm" />
            </div>
            <p className="text-base font-bold text-forest-800">{viagem.veiculo?.placa || '—'}</p>
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                <User size={11} className="shrink-0" />
                {viagem.motorista?.nome || 'Motorista não informado'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <Building2 size={11} className="shrink-0" />
                {viagem.transportadora?.nome || '—'}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp size={18} className="text-gray-400 shrink-0 mt-1" />
          ) : (
            <ChevronDown size={18} className="text-gray-400 shrink-0 mt-1" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
          {/* Veículo e motorista */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Veículo e condutor</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-0">
              <DetailRow
                label="Placa cavalo"
                value={viagem.veiculo?.placa}
              />
              <DetailRow label="Placa carreta" value={viagem.veiculo?.placaCarreta} />
              <DetailRow
                label="Tipo / modelo"
                value={
                  [viagem.veiculo?.tipo, viagem.veiculo?.marca, viagem.veiculo?.modelo]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
              />
              <DetailRow label="Motorista" value={viagem.motorista?.nome} />
              <DetailRow label="CPF motorista" value={viagem.motorista?.cpf} />
              {viagem.motorista?.telefone && (
                <div className="flex justify-between gap-4 py-1.5">
                  <span className="text-xs text-gray-500">Telefone</span>
                  <a
                    href={`tel:${viagem.motorista.telefone}`}
                    className="text-xs font-medium text-forest-700 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone size={11} />
                    {viagem.motorista.telefone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Empresa e origem */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Empresa e origem</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-0">
              <DetailRow label="Transportadora" value={viagem.transportadora?.nome} />
              <DetailRow label="CNPJ" value={viagem.transportadora?.cnpj} />
              <DetailRow label="Fornecedor" value={ag?.fornecedor?.nome} />
              <DetailRow label="Guia agendamento" value={ag?.numero} />
              <DetailRow
                label="Talhão"
                value={ag?.talhao ? `${ag.talhao.codigo ? `${ag.talhao.codigo} — ` : ''}${ag.talhao.nome}` : undefined}
              />
              <DetailRow label="Local embarque" value={ag?.localEmbarque?.nome} />
              <DetailRow label="Localidade" value={localidade || ag?.fazenda?.nome} />
            </div>
          </div>

          {/* Carga */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Carga</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-forest-50 rounded-lg">
                <p className="text-gray-500">Madeira</p>
                <p className="font-semibold text-gray-800">{ag?.tipoMadeira || '—'}</p>
              </div>
              <div className="p-2.5 bg-forest-50 rounded-lg">
                <p className="text-gray-500">Volume previsto</p>
                <p className="font-semibold text-gray-800">
                  {ag?.quantidadePrevistaM3 != null ? `${ag.quantidadePrevistaM3} m³` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Horários */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Horários</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-0">
              {ag?.dataHoraSaidaPrevista && (
                <DetailRow
                  label="Saída prevista"
                  value={format(new Date(ag.dataHoraSaidaPrevista), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
              )}
              {ag?.dataHoraChegadaPrevista && (
                <DetailRow
                  label="Chegada fábrica prev."
                  value={format(new Date(ag.dataHoraChegadaPrevista), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
              )}
              <DetailRow label="Tempo no status atual" value={tempoNaFila(viagem.updatedAt)} />
            </div>
          </div>

          {/* Documentos */}
          {docs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileText size={12} /> Documentos
              </p>
              <div className="space-y-1.5">
                {docs.map((doc, i) => (
                  <div
                    key={`${doc.tipo}-${doc.numero}-${i}`}
                    className="flex items-center justify-between gap-2 p-2 bg-white border border-gray-100 rounded-lg text-xs"
                  >
                    <span className="text-gray-600">{DOC_LABELS[doc.tipo] || doc.tipo}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{doc.numero || '—'}</span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ag?.observacoes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900">
              <p className="font-semibold mb-0.5">Observações</p>
              <p>{ag.observacoes}</p>
            </div>
          )}

          {/* Histórico recente */}
          {viagem.eventos && viagem.eventos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <History size={12} /> Histórico recente
              </p>
              <div className="space-y-1.5">
                {viagem.eventos.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400 shrink-0">
                      {format(new Date(ev.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                    <span className="flex-1">{ev.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-1">
            {viagem.status === 'agendado' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  fullWidth
                  loading={busy}
                  onClick={() => onAction(viagem.id, 'chegada')}
                >
                  Registrar chegada
                </Button>
                <Button size="sm" fullWidth loading={busy} onClick={() => onAction(viagem.id, 'iniciar')}>
                  Iniciar carregamento
                </Button>
              </>
            )}
            {viagem.status === 'aguardando_carregamento' && (
              <Button size="sm" fullWidth loading={busy} onClick={() => onAction(viagem.id, 'iniciar')}>
                Iniciar carregamento
              </Button>
            )}
            {viagem.status === 'em_carregamento' && (
              <Button size="sm" fullWidth loading={busy} onClick={() => onAction(viagem.id, 'concluir')}>
                Finalizar — marcar carregado
              </Button>
            )}
            {viagem.status === 'carregado' && (
              <p className="text-xs text-center text-teal-700 bg-teal-50 rounded-lg py-2 px-3">
                Carregamento concluído. Motorista pode iniciar a viagem.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

const FILTROS_VAZIOS: FiltrosState = {
  placa: '',
  motoristaId: '',
  transportadoraId: '',
  status: '',
}

export function CarregamentoArea() {
  const { user } = useAuth()
  const [resumo, setResumo] = useState<ResumoCarregamento | null>(null)
  const [viagens, setViagens] = useState<ViagemFila[]>([])
  const [totalNaFila, setTotalNaFila] = useState(0)
  const [opcoesFiltro, setOpcoesFiltro] = useState<OpcoesFiltro>({ transportadoras: [], motoristas: [] })
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showFiltros, setShowFiltros] = useState(true)
  const [placaInput, setPlacaInput] = useState('')
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_VAZIOS)

  const temFiltrosAtivos =
    !!filtros.placa || !!filtros.motoristaId || !!filtros.transportadoraId || !!filtros.status

  const load = useCallback(async (f: FiltrosState) => {
    setError('')
    try {
      const params = {
        placa: f.placa || undefined,
        motoristaId: f.motoristaId || undefined,
        transportadoraId: f.transportadoraId || undefined,
        status: f.status || undefined,
      }
      const [resumoRes, filaRes] = await Promise.all([
        carregamentosService.resumo(),
        carregamentosService.fila(params),
      ])
      setResumo(resumoRes.data)
      setViagens(filaRes.data.viagens || [])
      setTotalNaFila(filaRes.data.totalNaFila ?? filaRes.data.total ?? 0)
      setOpcoesFiltro(filaRes.data.opcoesFiltro || { transportadoras: [], motoristas: [] })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao carregar fila de carregamento')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros((prev) => (prev.placa === placaInput ? prev : { ...prev, placa: placaInput }))
    }, 350)
    return () => clearTimeout(timer)
  }, [placaInput])

  useEffect(() => {
    setLoading(true)
    load(filtros)
    const interval = setInterval(() => load(filtros), 30000)
    return () => clearInterval(interval)
  }, [filtros, load])

  async function handleAction(id: string, acao: 'chegada' | 'iniciar' | 'concluir') {
    setLoadingId(id)
    setError('')
    try {
      if (acao === 'chegada') await carregamentosService.registrarChegada(id)
      else if (acao === 'iniciar') await carregamentosService.iniciar(id)
      else await carregamentosService.concluir(id)
      await load(filtros)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao atualizar carregamento')
    } finally {
      setLoadingId(null)
    }
  }

  function limparFiltros() {
    setPlacaInput('')
    setFiltros(FILTROS_VAZIOS)
  }

  const fazendaNome =
    resumo?.fazenda?.nome ||
    (user as { fazenda?: { nome: string } })?.fazenda?.nome ||
    'Área de carregamento'

  return (
    <PageLayout
      title="Carregamento"
      subtitle={fazendaNome}
      showBack
      backPath="/menu"
      rightContent={
        <button
          type="button"
          onClick={() => { setLoading(true); load(filtros) }}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          aria-label="Atualizar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <KPICard title="Na fila" value={resumo.total} icon={<Truck size={18} />} color="blue" />
          <KPICard title="Aguardando" value={resumo.agendado + resumo.aguardando_carregamento} icon={<Clock size={18} />} color="yellow" />
          <KPICard title="Carregando" value={resumo.em_carregamento} icon={<Package size={18} />} color="orange" />
          <KPICard title="Carregados" value={resumo.carregado} icon={<User size={18} />} color="green" />
        </div>
      )}

      {/* Filtros */}
      <Card padding="md" className="mb-4">
        <button
          type="button"
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
          onClick={() => setShowFiltros(!showFiltros)}
        >
          <span className="flex items-center gap-2">
            <Filter size={16} className="text-forest-600" />
            Filtros
            {temFiltrosAtivos && (
              <span className="text-xs font-normal bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full">
                ativos
              </span>
            )}
          </span>
          {showFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFiltros && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <Input
              label="Placa"
              placeholder="Ex: ABC1D23 ou carreta"
              value={placaInput}
              onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
              leftIcon={<Search size={16} />}
            />
            <Select
              label="Motorista"
              placeholder="Todos os motoristas"
              options={[
                { value: '', label: 'Todos os motoristas' },
                ...opcoesFiltro.motoristas.map((m) => ({ value: m.id, label: m.nome })),
              ]}
              value={filtros.motoristaId}
              onChange={(e) => setFiltros((f) => ({ ...f, motoristaId: e.target.value }))}
            />
            <Select
              label="Empresa (transportadora)"
              placeholder="Todas as empresas"
              options={[
                { value: '', label: 'Todas as empresas' },
                ...opcoesFiltro.transportadoras.map((t) => ({ value: t.id, label: t.nome })),
              ]}
              value={filtros.transportadoraId}
              onChange={(e) => setFiltros((f) => ({ ...f, transportadoraId: e.target.value }))}
            />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTROS.map((s) => (
                  <button
                    key={s.value || 'todos'}
                    type="button"
                    onClick={() => setFiltros((f) => ({ ...f, status: s.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      filtros.status === s.value
                        ? 'bg-forest-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {temFiltrosAtivos && (
              <Button variant="outline" size="sm" fullWidth onClick={limparFiltros} icon={<X size={14} />}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl py-2 px-3 mb-4 text-center">{error}</p>
      )}

      {!loading && (
        <p className="text-xs text-gray-500 mb-3">
          {viagens.length === totalNaFila
            ? `${viagens.length} veículo(s) na fila`
            : `${viagens.length} de ${totalNaFila} veículo(s) — filtros aplicados`}
        </p>
      )}

      {loading && viagens.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : viagens.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {temFiltrosAtivos ? 'Nenhum veículo com estes filtros' : 'Nenhum veículo na fila'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {temFiltrosAtivos
              ? 'Tente ajustar placa, motorista ou empresa'
              : 'Viagens agendadas para esta fazenda aparecerão aqui'}
          </p>
          {temFiltrosAtivos && (
            <Button variant="outline" size="sm" className="mt-4" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {viagens.map((v) => (
            <ViagemCard
              key={v.id}
              viagem={v}
              expanded={expandedId === v.id}
              onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
              onAction={handleAction}
              loadingId={loadingId}
            />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
