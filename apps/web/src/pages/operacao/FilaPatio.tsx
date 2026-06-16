import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Truck, RefreshCw, ChevronDown, ChevronUp, Building2, MapPin,
  FileText, Scale, AlertTriangle, Phone, Package, Calendar, User,
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { FilaPatio as FilaPatioType } from '../../types'
import { filaService } from '../../services/api'

interface FilaResumo {
  total: number
  aguardando_portaria: number
  aguardando_balanca: number
  aguardando_descarga: number
  tempoMedioEstimado: number
}

interface FilaItemExtended extends FilaPatioType {
  createdAt?: string
  updatedAt?: string
  viagem?: FilaPatioType['viagem'] & {
    numero?: string
    documentos?: Array<{ tipo: string; numero?: string; status: string }>
    pesagens?: Array<{ tipo: string; pesoBrutoKg: number; pesoLiquidoKg?: number; ticketBalanca?: string; balanca?: string; createdAt: string }>
    descargas?: Array<{ doca: string; material?: string; status: string }>
    checkins?: Array<{ acao: string; createdAt: string; user?: { nome: string }; motivo?: string }>
    alertas?: Array<{ tipo: string; severidade: string; mensagem: string }>
  }
}

const STATUS_FILA: Record<string, { label: string; color: string }> = {
  aguardando_portaria: { label: 'Aguard. Portaria', color: 'bg-blue-100 text-blue-700' },
  aguardando_balanca: { label: 'Aguard. Balança', color: 'bg-yellow-100 text-yellow-700' },
  aguardando_descarga: { label: 'Aguard. Descarga', color: 'bg-orange-100 text-orange-700' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
}

const DOC_LABELS: Record<string, string> = {
  nota_fiscal: 'NF',
  mdfe: 'MDF-e',
  ordem_carregamento: 'OC',
  anexo: 'Anexo',
}

function tempoNaFila(createdAt?: string): string {
  if (!createdAt) return '—'
  const min = differenceInMinutes(new Date(), new Date(createdAt))
  if (min < 1) return 'Agora'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}

function FilaItemCard({
  item,
  expanded,
  onToggle,
  onUpdateStatus,
  onVerViagem,
}: {
  item: FilaItemExtended
  expanded: boolean
  onToggle: () => void
  onUpdateStatus: (id: string, status: string) => void
  onVerViagem: (id: string) => void
}) {
  const v = item.viagem
  const ag = v?.agendamento
  const statusCfg = STATUS_FILA[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' }
  const pesagemInicial = v?.pesagens?.find((p) => p.tipo === 'inicial')
  const pesagemFinal = v?.pesagens?.find((p) => p.tipo === 'final')
  const checkin = v?.checkins?.[0]
  const descarga = v?.descargas?.[0]
  const docsPendentes = v?.documentos?.filter((d) => d.status !== 'valido').length || 0

  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-forest-700">{item.posicao}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-800">{v?.veiculo?.placa || '—'}</p>
                {v?.veiculo?.placaCarreta && (
                  <span className="text-xs text-gray-400">+ {v.veiculo.placaCarreta}</span>
                )}
                {v?.numero && (
                  <span className="text-xs text-gray-400 font-mono">{v.numero}</span>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            <p className="text-xs text-gray-600">
              {v?.motorista?.nome}
              {v?.motorista?.telefone && (
                <span className="text-gray-400"> · {v.motorista.telefone}</span>
              )}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {ag?.transportadora?.nome || v?.transportadora?.nome}
              {ag?.fazenda?.nome && ` · ${ag.fazenda.nome}`}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                Fila: {tempoNaFila(item.createdAt)}
              </span>
              {item.tempoEstimadoMin != null && (
                <span className="text-xs text-gray-500">Estimado: ~{item.tempoEstimadoMin} min</span>
              )}
              {ag?.quantidadePrevistaM3 && (
                <span className="text-xs text-forest-600 font-semibold">{ag.quantidadePrevistaM3} m³</span>
              )}
              {ag?.tipoMadeira && (
                <span className="text-xs text-gray-500">{ag.tipoMadeira}</span>
              )}
              {docsPendentes > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <FileText size={12} />
                  {docsPendentes} doc. pendente{docsPendentes > 1 ? 's' : ''}
                </span>
              )}
              {(v?.alertas?.length || 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle size={12} />
                  {v!.alertas!.length} alerta{v!.alertas!.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-gray-400 pt-1">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Veículo e transporte */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Truck size={12} /> Veículo
              </p>
              <DetailRow label="Placa" value={v?.veiculo?.placa} />
              <DetailRow label="Carreta" value={v?.veiculo?.placaCarreta} />
              <DetailRow label="Tipo" value={v?.veiculo?.tipo} />
              <DetailRow label="Transportadora" value={ag?.transportadora?.nome || v?.transportadora?.nome} />
              {v?.status && (
                <div className="pt-2">
                  <StatusBadge status={v.status} />
                </div>
              )}
            </div>

            {/* Origem e carga */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <MapPin size={12} /> Origem / Carga
              </p>
              <DetailRow label="Fornecedor" value={ag?.fornecedor?.nome} />
              <DetailRow label="Fazenda" value={ag?.fazenda?.nome} />
              <DetailRow label="Talhão" value={ag?.talhao?.nome} />
              <DetailRow label="Local embarque" value={ag?.localEmbarque?.nome} />
              <DetailRow label="Madeira" value={ag?.tipoMadeira} />
              <DetailRow label="Volume previsto" value={ag?.quantidadePrevistaM3 ? `${ag.quantidadePrevistaM3} m³` : undefined} />
            </div>

            {/* Agenda e tempos */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Calendar size={12} /> Agenda
              </p>
              <DetailRow label="Agendamento" value={ag?.numero} />
              <DetailRow
                label="Saída prevista"
                value={ag?.dataHoraSaidaPrevista
                  ? format(new Date(ag.dataHoraSaidaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : undefined}
              />
              <DetailRow
                label="Chegada prevista"
                value={ag?.dataHoraChegadaPrevista
                  ? format(new Date(ag.dataHoraChegadaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : undefined}
              />
              <DetailRow label="Entrada na fila" value={item.createdAt ? format(new Date(item.createdAt), "dd/MM HH:mm", { locale: ptBR }) : undefined} />
              <DetailRow label="Tempo na fila" value={tempoNaFila(item.createdAt)} />
            </div>
          </div>

          {/* Documentos */}
          {v?.documentos && v.documentos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <FileText size={12} /> Documentos
              </p>
              <div className="flex flex-wrap gap-2">
                {v.documentos.map((doc, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      doc.status === 'valido'
                        ? 'bg-green-100 text-green-700'
                        : doc.status === 'invalido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {DOC_LABELS[doc.tipo] || doc.tipo}
                    {doc.numero && ` ${doc.numero}`}
                    {' · '}{doc.status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portaria, pesagem, descarga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {checkin && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                  <Building2 size={12} /> Portaria
                </p>
                <p className="text-xs text-gray-700 capitalize">{checkin.acao}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(checkin.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                  {checkin.user?.nome && ` · ${checkin.user.nome}`}
                </p>
              </div>
            )}
            {(pesagemInicial || pesagemFinal) && (
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                  <Scale size={12} /> Pesagem
                </p>
                {pesagemInicial && (
                  <p className="text-xs text-gray-700">
                    Inicial: {pesagemInicial.pesoBrutoKg.toLocaleString('pt-BR')} kg
                    {pesagemInicial.ticketBalanca && ` · Ticket ${pesagemInicial.ticketBalanca}`}
                  </p>
                )}
                {pesagemFinal && (
                  <p className="text-xs text-gray-700">
                    Líquido: {pesagemFinal.pesoLiquidoKg?.toLocaleString('pt-BR')} kg
                  </p>
                )}
              </div>
            )}
            {descarga && (
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                  <Package size={12} /> Descarga
                </p>
                <p className="text-xs text-gray-700">Doca {descarga.doca}</p>
                {descarga.material && <p className="text-xs text-gray-500">{descarga.material}</p>}
              </div>
            )}
          </div>

          {/* Alertas */}
          {v?.alertas && v.alertas.length > 0 && (
            <div className="space-y-2">
              {v.alertas.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800 capitalize">{a.tipo.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-red-600">{a.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => v?.id && onVerViagem(v.id)}>
              Ver viagem completa
            </Button>
            {item.status === 'aguardando_portaria' && (
              <Button size="sm" onClick={() => onUpdateStatus(item.id, 'aguardando_balanca')}>
                Mover para Balança
              </Button>
            )}
            {item.status === 'aguardando_balanca' && (
              <Button size="sm" onClick={() => onUpdateStatus(item.id, 'aguardando_descarga')}>
                Mover para Descarga
              </Button>
            )}
            {item.status === 'aguardando_descarga' && (
              <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(item.id, 'concluido')}>
                Concluído
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export function FilaPatio() {
  const navigate = useNavigate()
  const [fila, setFila] = useState<FilaItemExtended[]>([])
  const [resumo, setResumo] = useState<FilaResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function loadFila() {
    setLoading(true)
    Promise.all([filaService.list(), filaService.resumo()])
      .then(([filaRes, resumoRes]) => {
        setFila(filaRes.data)
        setResumo(resumoRes.data)
      })
      .catch(() => {
        setFila([])
        setResumo(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadFila() }, [])

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await filaService.updateStatus(id, status)
      loadFila()
    } catch {
      setFila((f) => f.map((item) => (item.id === id ? { ...item, status } : item)))
    }
  }

  return (
    <PageLayout
      title="Fila / Pátio"
      subtitle={resumo ? `${resumo.total} veículos aguardando` : 'Controle de espera'}
      header={
        <AppHeader
          title="Fila / Pátio"
          subtitle={resumo ? `${resumo.total} veículos aguardando` : undefined}
          showBack
          backPath="/menu"
          rightContent={
            <button onClick={loadFila} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          }
        />
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          title="Total na fila"
          value={resumo?.total ?? '—'}
          icon={<Truck size={20} />}
          color="green"
          loading={loading}
        />
        <KPICard
          title="Aguard. Portaria"
          value={resumo?.aguardando_portaria ?? '—'}
          icon={<Building2 size={20} />}
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Aguard. Balança"
          value={resumo?.aguardando_balanca ?? '—'}
          icon={<Scale size={20} />}
          color="yellow"
          loading={loading}
        />
        <KPICard
          title="Aguard. Descarga"
          value={resumo?.aguardando_descarga ?? '—'}
          subtitle={resumo?.tempoMedioEstimado ? `Média ~${resumo.tempoMedioEstimado} min` : undefined}
          icon={<Package size={20} />}
          color="orange"
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : fila.length === 0 ? (
        <div className="text-center py-16">
          <Truck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum veículo na fila</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fila.map((item) => (
            <FilaItemCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onUpdateStatus={handleUpdateStatus}
              onVerViagem={(id) => navigate(`/viagens/${id}`)}
            />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
