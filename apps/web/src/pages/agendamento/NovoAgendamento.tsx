import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Truck, User, MapPin, Trees } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { agendamentosService, cadastrosService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { CACHE_TTL, getSessionCache, setSessionCache } from '../../utils/apiCache'
import {
  labelVeiculo,
  listasTransporte,
  valoresIniciaisTransporte,
  type ContextoFormularioAgendamento,
  type VeiculoOption,
} from '../../utils/agendamentoFormContext'

interface FormData {
  transportadoraId: string
  motoristaId: string
  veiculoId: string
  fornecedorId: string
  fazendaId: string
  talhaoId: string
  tipoMadeira: string
  quantidadePrevistaM3: string
  dataHoraSaidaPrevista: string
  dataHoraChegadaPrevista: string
  observacoes: string
}

interface CadastrosBundle {
  transportadoras: { id: string; nome: string }[]
  motoristas: { id: string; nome: string; transportadoraId?: string }[]
  veiculos: VeiculoOption[]
  fornecedores: { id: string; nome: string }[]
  fazendas: { id: string; nome: string; cidade: string; estado: string }[]
  tiposMadeira: { descricao: string; codigo: string }[]
}

export function NovoAgendamento() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const dataHora = location.state?.dataHora || new Date().toISOString()
  const dtFormatted = format(new Date(dataHora), "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState<FormData>({
    transportadoraId: '',
    motoristaId: '',
    veiculoId: '',
    fornecedorId: '',
    fazendaId: '',
    talhaoId: '',
    tipoMadeira: '',
    quantidadePrevistaM3: '',
    dataHoraSaidaPrevista: dtFormatted,
    dataHoraChegadaPrevista: '',
    observacoes: '',
  })

  const [bundle, setBundle] = useState<CadastrosBundle | null>(null)
  const [ctx, setCtx] = useState<ContextoFormularioAgendamento | null>(null)
  const [loadingCadastros, setLoadingCadastros] = useState(true)
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])
  const [fazendas, setFazendas] = useState<{ id: string; nome: string; cidade: string; estado: string }[]>([])
  const [talhoes, setTalhoes] = useState<{ id: string; nome: string }[]>([])
  const [tiposMadeira, setTiposMadeira] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    const cached = getSessionCache<CadastrosBundle>('cadastros-agendamento')

    const loadBundle = cached
      ? Promise.resolve({ data: cached })
      : cadastrosService.bundleAgendamento().then((r) => {
          setSessionCache('cadastros-agendamento', r.data, CACHE_TTL.cadastros)
          return r
        })

    Promise.all([loadBundle, agendamentosService.contextoFormulario().catch(() => ({ data: null }))])
      .then(([bundleRes, ctxRes]) => {
        const b = bundleRes.data as CadastrosBundle
        const contexto = ctxRes.data as ContextoFormularioAgendamento | null
        setBundle(b)
        setCtx(contexto)
        setFornecedores(b.fornecedores)
        setFazendas(b.fazendas)
        setTiposMadeira(b.tiposMadeira.map((x) => ({ value: x.descricao, label: x.descricao })))

        const iniciais = valoresIniciaisTransporte(contexto)
        setForm((f) => ({
          ...f,
          transportadoraId: iniciais.transportadoraId,
          motoristaId: iniciais.motoristaId,
          veiculoId: iniciais.veiculoId,
        }))
      })
      .catch(console.error)
      .finally(() => setLoadingCadastros(false))
  }, [])

  useEffect(() => {
    if (form.fazendaId) {
      cadastrosService.talhoes(form.fazendaId)
        .then((r) => setTalhoes(r.data))
        .catch(console.error)
    }
  }, [form.fazendaId])

  const listas = useMemo(() => {
    if (!bundle) {
      return { transportadoras: [], motoristas: [], veiculos: [] }
    }
    return listasTransporte(ctx, bundle, form.transportadoraId)
  }, [bundle, ctx, form.transportadoraId])

  function update(field: keyof FormData, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'transportadoraId' && !ctx?.bloquearTransportadora) {
        next.motoristaId = ''
        next.veiculoId = ''
      }
      return next
    })
  }

  function handleNext() {
    navigate('/agendamento/documentos', { state: { form } })
  }

  const bloquearTransportadora = !!ctx?.bloquearTransportadora
  const bloquearMotorista = !!ctx?.bloquearMotorista

  const isValid = form.transportadoraId && form.motoristaId && form.veiculoId &&
    form.fornecedorId && form.fazendaId && form.talhaoId &&
    form.tipoMadeira && form.quantidadePrevistaM3

  const tiposMadeiraFallback = [
    { value: 'Eucalipto', label: 'Eucalipto' },
    { value: 'Pinus', label: 'Pinus' },
  ]

  const opcoesMadeira = tiposMadeira.length > 0 ? tiposMadeira : tiposMadeiraFallback

  const subtitulo =
    user?.perfil === 'motorista'
      ? 'Seus dados de transporte já foram preenchidos'
      : user?.perfil === 'transportador'
        ? 'Transportadora vinculada ao seu usuário'
        : 'Preencha os dados da viagem'

  return (
    <PageLayout
      header={
        <AppHeader title="Novo Agendamento" subtitle={subtitulo} showBack />
      }
    >
      <div className="space-y-4 pb-4">
        {(user?.perfil === 'motorista' || user?.perfil === 'transportador') && ctx?.transportadora && (
          <Card className="bg-forest-50 border-forest-100">
            <p className="text-xs text-forest-700">
              {user.perfil === 'motorista'
                ? `Logado como ${ctx.motorista?.nome || user.nome} · ${ctx.transportadora.nome}`
                : `Transportadora: ${ctx.transportadora.nome}`}
              {listas.veiculos.length > 1 && ' · Selecione o veículo abaixo'}
            </p>
          </Card>
        )}

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Transportadora & Motorista</h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Transportadora"
              required
              placeholder={loadingCadastros ? 'Carregando...' : 'Selecione'}
              value={form.transportadoraId}
              onChange={(e) => update('transportadoraId', e.target.value)}
              options={listas.transportadoras.map((t) => ({ value: t.id, label: t.nome }))}
              disabled={bloquearTransportadora || loadingCadastros}
            />
            <Select
              label="Motorista"
              required
              placeholder={loadingCadastros ? 'Carregando...' : 'Selecione'}
              value={form.motoristaId}
              onChange={(e) => update('motoristaId', e.target.value)}
              options={listas.motoristas.map((m) => ({ value: m.id, label: m.nome }))}
              disabled={bloquearMotorista || loadingCadastros || !form.transportadoraId}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">
              Veículo
              {listas.veiculos.length > 1 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  {listas.veiculos.length} disponíveis
                </span>
              )}
            </h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Placa do Cavalo / Veículo"
              required
              placeholder={
                loadingCadastros
                  ? 'Carregando...'
                  : listas.veiculos.length === 0
                    ? 'Nenhum veículo cadastrado'
                    : 'Selecione'
              }
              value={form.veiculoId}
              onChange={(e) => update('veiculoId', e.target.value)}
              options={listas.veiculos.map((v) => ({
                value: v.id,
                label: labelVeiculo(v),
              }))}
              disabled={loadingCadastros || listas.veiculos.length === 0}
            />
            <Select
              label="Tipo de Veículo"
              placeholder="Tipo"
              value={form.veiculoId ? listas.veiculos.find((v) => v.id === form.veiculoId)?.tipo || '' : ''}
              onChange={() => {}}
              options={[
                { value: 'bitrem', label: 'Bitrem' },
                { value: 'rodotrem', label: 'Rodotrem' },
                { value: 'truck', label: 'Truck' },
                { value: 'carreta', label: 'Carreta' },
              ]}
              disabled
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Fornecedor / Origem</h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Fornecedor"
              required
              placeholder="Selecione"
              value={form.fornecedorId}
              onChange={(e) => update('fornecedorId', e.target.value)}
              options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
            />
            <Select
              label="Fazenda / Origem"
              required
              placeholder="Selecione"
              value={form.fazendaId}
              onChange={(e) => update('fazendaId', e.target.value)}
              options={fazendas.map((f) => ({
                value: f.id,
                label: `${f.nome} - ${f.cidade}/${f.estado}`,
              }))}
            />
            <Select
              label="Talhão"
              required
              placeholder="Selecione"
              value={form.talhaoId}
              onChange={(e) => update('talhaoId', e.target.value)}
              options={talhoes.map((t) => ({ value: t.id, label: t.nome }))}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trees size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Madeira</h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Tipo de Madeira"
              required
              placeholder="Selecione"
              value={form.tipoMadeira}
              onChange={(e) => update('tipoMadeira', e.target.value)}
              options={opcoesMadeira}
            />
            <Input
              label="Quantidade Prevista (m³)"
              type="number"
              placeholder="Ex: 45.50"
              required
              value={form.quantidadePrevistaM3}
              onChange={(e) => update('quantidadePrevistaM3', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Datas Previstas</h3>
          </div>
          <div className="space-y-3">
            <Input
              label="Data/hora prevista de saída"
              type="datetime-local"
              required
              readOnly
              value={form.dataHoraSaidaPrevista}
              helper="Horário definido na grade de agendamento"
            />
            <Input
              label="Data/hora prevista de chegada"
              type="datetime-local"
              value={form.dataHoraChegadaPrevista}
              onChange={(e) => update('dataHoraChegadaPrevista', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => update('observacoes', e.target.value)}
            placeholder="Observações opcionais..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 resize-none"
          />
        </Card>

        <Button
          fullWidth
          size="lg"
          disabled={!isValid || loadingCadastros}
          onClick={handleNext}
        >
          Avançar para Documentos →
        </Button>
      </div>
    </PageLayout>
  )
}
