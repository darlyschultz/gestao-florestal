import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, CheckCircle, XCircle, Truck, User, FileText, MapPin, AlertCircle, Clock, TreePine, Building2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { DocumentosPortaria } from '../../components/ui/DocumentosPortaria'
import { Viagem, DocumentoViagem } from '../../types'
import { portariaService } from '../../services/api'

const MOCK_RESULT: Viagem = {
  id: '3',
  numero: 'VGM-2024-0003',
  agendamentoId: '3',
  transportadoraId: '2',
  motoristaId: '3',
  veiculoId: '3',
  status: 'em_transito',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  agendamento: {
    id: '3',
    numero: 'AGD-2024-0003',
    transportadoraId: '2',
    motoristaId: '3',
    veiculoId: '3',
    fornecedorId: '2',
    fazendaId: '3',
    talhaoId: '3',
    tipoMadeira: 'Eucalipto',
    quantidadePrevistaM3: 52,
    dataHoraSaidaPrevista: new Date('2024-05-02T07:00:00').toISOString(),
    dataHoraChegadaPrevista: new Date('2024-05-02T15:00:00').toISOString(),
    status: 'confirmado',
    fazenda: { id: '3', nome: 'Faz. São Pedro', cidade: 'Anápolis', estado: 'GO', fornecedorId: '2' },
    veiculo: { id: '3', placa: 'CHE3634', tipo: 'bitrem', placaCarreta: 'AAI1822' },
  },
  transportadora: { id: '2', nome: 'LogFlorestal', cnpj: '' },
  motorista: { id: '3', nome: 'Paulo Henrique Souza', cpf: '', cnh: '', transportadoraId: '2', telefone: '(19) 98765-0001' },
  veiculo: { id: '3', placa: 'CHE3634', tipo: 'bitrem', placaCarreta: 'AAI1822' },
  documentos: [
    { id: '1', viagemId: '3', tipo: 'nota_fiscal', numero: 'NF-0012345', status: 'valido' },
    { id: '2', viagemId: '3', tipo: 'mdfe', numero: 'MDF-0056789', status: 'valido' },
    { id: '3', viagemId: '3', tipo: 'ordem_carregamento', numero: 'OC-003456', status: 'pendente' },
  ],
}

interface CheckinPortariaProps {
  query?: string
  searchTrigger?: number
  autoSearch?: boolean
  embedded?: boolean
  onSearchingChange?: (searching: boolean) => void
}

export function CheckinPortaria({
  query = '',
  searchTrigger = 0,
  autoSearch = false,
  embedded = false,
  onSearchingChange,
}: CheckinPortariaProps) {
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<Viagem | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [action, setAction] = useState<'liberado' | 'bloqueado' | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')
  const [showBloqueioInput, setShowBloqueioInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [documentos, setDocumentos] = useState<DocumentoViagem[]>([])

  function setResultWithDocs(viagem: Viagem) {
    setResult(viagem)
    setDocumentos(viagem.documentos || [])
  }

  useEffect(() => {
    if (autoSearch && query.trim()) {
      handleSearch(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchTrigger > 0 && query.trim()) {
      handleSearch(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger])

  async function handleSearch(searchTerm: string) {
    const term = searchTerm.trim()
    if (!term) return
    setSearching(true)
    onSearchingChange?.(true)
    setNotFound(false)
    setResult(null)
    setDocumentos([])
    setAction(null)

    try {
      const r = await portariaService.buscar(term)
      if (r.data.length > 0) {
        setResultWithDocs(r.data[0])
      } else {
        // Demo mock
        if (term.toLowerCase().includes('che') || term.toLowerCase().includes('2024')) {
          setResultWithDocs(MOCK_RESULT)
        } else {
          setNotFound(true)
        }
      }
    } catch {
      if (term.toLowerCase().includes('che') || term.toLowerCase().includes('2024') || term === '') {
        setResultWithDocs(MOCK_RESULT)
      } else {
        setNotFound(true)
      }
    } finally {
      setSearching(false)
      onSearchingChange?.(false)
    }
  }

  async function handleLiberar() {
    if (!result) return
    setLoading(true)
    try {
      await portariaService.liberar(result.id)
    } catch {}
    setAction('liberado')
    setLoading(false)
  }

  async function handleBloquear() {
    if (!result || !motivoBloqueio.trim()) return
    setLoading(true)
    try {
      await portariaService.bloquear(result.id, motivoBloqueio)
    } catch {}
    setAction('bloqueado')
    setShowBloqueioInput(false)
    setLoading(false)
  }

  return (
    <div className="space-y-4 pb-4">
        {embedded && !query.trim() && !result && !searching && (
          <Card className="border border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500 text-center py-4">
              Use o filtro principal acima para buscar e fazer check-in
            </p>
          </Card>
        )}

        {/* Resultado */}
        {notFound && (
          <Card className="border border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">Nenhuma viagem encontrada para "{query}"</p>
            </div>
          </Card>
        )}

        {result && (
          <>
            {/* Ação realizada */}
            {action && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl ${
                  action === 'liberado'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {action === 'liberado' ? (
                  <CheckCircle size={24} className="text-green-600" />
                ) : (
                  <XCircle size={24} className="text-red-600" />
                )}
                <div>
                  <p className={`font-bold text-sm ${action === 'liberado' ? 'text-green-700' : 'text-red-700'}`}>
                    {action === 'liberado' ? 'Entrada Liberada!' : 'Entrada Bloqueada'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {action === 'liberado'
                      ? 'Veículo adicionado à fila de balança'
                      : `Motivo: ${motivoBloqueio}`}
                  </p>
                </div>
              </div>
            )}

            {/* Dados do agendamento */}
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">{result.agendamento?.numero}</p>
                  <h3 className="text-base font-bold text-gray-900">{result.numero}</h3>
                </div>
                <StatusBadge status={result.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                    <Clock size={11} /> Saída prev.
                  </p>
                  <p className="text-xs font-semibold text-gray-800">
                    {result.agendamento?.dataHoraSaidaPrevista
                      ? format(new Date(result.agendamento.dataHoraSaidaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <p className="text-xs text-purple-500 mb-0.5 flex items-center gap-1">
                    <Clock size={11} /> Chegada prev.
                  </p>
                  <p className="text-xs font-semibold text-purple-900">
                    {result.agendamento?.dataHoraChegadaPrevista
                      ? format(new Date(result.agendamento.dataHoraChegadaPrevista), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                    <Truck size={11} /> Placa
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {result.agendamento?.veiculo?.placa}
                  </p>
                  <p className="text-xs text-gray-500">{result.agendamento?.veiculo?.tipo}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Placa Carreta</p>
                  <p className="text-sm font-bold text-gray-800">
                    {result.agendamento?.veiculo?.placaCarreta || '—'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Motorista</p>
                    <p className="text-sm font-medium text-gray-800">
                      {result.motorista?.nome}
                      {result.motorista?.telefone && (
                        <span className="text-xs text-gray-400 font-normal ml-1">· {result.motorista.telefone}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Transportadora</p>
                    <p className="text-sm font-medium text-gray-800">{result.transportadora?.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Fornecedor</p>
                    <p className="text-sm font-medium text-gray-800">{result.agendamento?.fornecedor?.nome || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Origem</p>
                    <p className="text-sm font-medium text-gray-800">
                      {result.agendamento?.fazenda?.nome}
                      {result.agendamento?.fazenda?.cidade && ` — ${result.agendamento.fazenda.cidade}/${result.agendamento.fazenda.estado}`}
                      {result.agendamento?.talhao?.nome && ` · ${result.agendamento.talhao.nome}`}
                      {result.agendamento?.localEmbarque?.nome && ` · ${result.agendamento.localEmbarque.nome}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TreePine size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Carga</p>
                    <p className="text-sm font-medium text-gray-800">
                      {result.agendamento?.tipoMadeira || '—'}
                      {result.agendamento?.quantidadePrevistaM3 != null && (
                        <span> · {result.agendamento.quantidadePrevistaM3} m³</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Documentos para validação */}
            {documentos.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <FileText size={16} className="text-forest-600" />
                  Documentos da Viagem
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Visualize e valide cada documento antes de liberar a entrada
                </p>
                <DocumentosPortaria
                  documentos={documentos}
                  onUpdate={setDocumentos}
                />
              </Card>
            )}

            {documentos.some((d) => d.status === 'pendente' || d.status === 'invalido') && !action && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Existem documentos pendentes ou inválidos. Revise antes de liberar a entrada.
                </p>
              </div>
            )}

            {/* Ações */}
            {!action && (
              <div className="space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={handleLiberar}
                  icon={<CheckCircle size={18} />}
                >
                  Liberar Entrada
                </Button>

                {showBloqueioInput ? (
                  <Card>
                    <Input
                      label="Motivo do bloqueio"
                      placeholder="Descreva o motivo..."
                      value={motivoBloqueio}
                      onChange={(e) => setMotivoBloqueio(e.target.value)}
                      required
                    />
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" fullWidth onClick={() => setShowBloqueioInput(false)}>
                        Cancelar
                      </Button>
                      <Button variant="danger" fullWidth loading={loading} disabled={!motivoBloqueio.trim()} onClick={handleBloquear}>
                        Confirmar Bloqueio
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Button
                    fullWidth
                    variant="danger"
                    size="lg"
                    onClick={() => setShowBloqueioInput(true)}
                    icon={<XCircle size={18} />}
                  >
                    Bloquear Entrada
                  </Button>
                )}
              </div>
            )}
          </>
        )}
    </div>
  )
}
