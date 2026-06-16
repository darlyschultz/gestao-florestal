import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Truck, User, MapPin, Trees } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cadastrosService } from '../../services/api'

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

export function NovoAgendamento() {
  const navigate = useNavigate()
  const location = useLocation()

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

  const [transportadoras, setTransportadoras] = useState<{ id: string; nome: string }[]>([])
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: string; placa: string; tipo: string }[]>([])
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])
  const [fazendas, setFazendas] = useState<{ id: string; nome: string; cidade: string; estado: string }[]>([])
  const [talhoes, setTalhoes] = useState<{ id: string; nome: string }[]>([])
  const [tiposMadeira, setTiposMadeira] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    Promise.all([
      cadastrosService.transportadoras(),
      cadastrosService.motoristas(),
      cadastrosService.veiculos(),
      cadastrosService.fornecedores(),
      cadastrosService.fazendas(),
      cadastrosService.tiposMadeira(),
    ]).then(([t, m, v, f, fz, tm]) => {
      setTransportadoras(t.data)
      setMotoristas(m.data)
      setVeiculos(v.data)
      setFornecedores(f.data)
      setFazendas(fz.data)
      setTiposMadeira(tm.data.map((x: { descricao: string; codigo: string }) => ({
        value: x.descricao,
        label: x.descricao,
      })))
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (form.fazendaId) {
      cadastrosService.talhoes(form.fazendaId)
        .then((r) => setTalhoes(r.data))
        .catch(console.error)
    }
  }, [form.fazendaId])

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleNext() {
    navigate('/agendamento/documentos', { state: { form } })
  }

  const isValid = form.transportadoraId && form.motoristaId && form.veiculoId &&
    form.fornecedorId && form.fazendaId && form.talhaoId &&
    form.tipoMadeira && form.quantidadePrevistaM3

  const tiposMadeiraFallback = [
    { value: 'Eucalipto', label: 'Eucalipto' },
    { value: 'Pinus', label: 'Pinus' },
  ]

  const opcoesMadeira = tiposMadeira.length > 0 ? tiposMadeira : tiposMadeiraFallback

  return (
    <PageLayout
      header={
        <AppHeader title="Novo Agendamento" subtitle="Preencha os dados da viagem" showBack />
      }
    >
      <div className="space-y-4 pb-4">
        {/* Transportadora & Motorista */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Transportadora & Motorista</h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Transportadora"
              required
              placeholder="Selecione"
              value={form.transportadoraId}
              onChange={(e) => update('transportadoraId', e.target.value)}
              options={transportadoras.map((t) => ({ value: t.id, label: t.nome }))}
            />
            <Select
              label="Motorista"
              required
              placeholder="Selecione"
              value={form.motoristaId}
              onChange={(e) => update('motoristaId', e.target.value)}
              options={motoristas.map((m) => ({ value: m.id, label: m.nome }))}
            />
          </div>
        </Card>

        {/* Veículo */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Veículo</h3>
          </div>
          <div className="space-y-3">
            <Select
              label="Placa do Cavalo / Veículo"
              required
              placeholder="Selecione"
              value={form.veiculoId}
              onChange={(e) => update('veiculoId', e.target.value)}
              options={veiculos.map((v) => ({
                value: v.id,
                label: `${v.placa} - ${v.tipo}`,
              }))}
            />
            <Select
              label="Tipo de Veículo"
              placeholder="Tipo"
              value={form.veiculoId ? veiculos.find((v) => v.id === form.veiculoId)?.tipo || '' : ''}
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

        {/* Origem */}
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

        {/* Madeira */}
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

        {/* Datas */}
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

        {/* Observações */}
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
          disabled={!isValid}
          onClick={handleNext}
        >
          Avançar para Documentos →
        </Button>
      </div>
    </PageLayout>
  )
}
