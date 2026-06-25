import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CheckCircle, FileText, Save, Truck } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { agendamentosService, cadastrosService } from '../../services/api'
import { useAgendamentoRegras } from '../../hooks/useAgendamentoRegras'
import { useAuth } from '../../contexts/AuthContext'

export function CompletarAgendamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { regras } = useAgendamentoRegras()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [numero, setNumero] = useState('')
  const [pendencias, setPendencias] = useState<Array<{ label: string; grupo: string }>>([])
  const [prontoConfirmar, setProntoConfirmar] = useState(false)

  const [form, setForm] = useState({
    transportadoraId: '',
    motoristaId: '',
    veiculoId: '',
    fornecedorId: '',
    fazendaId: '',
    talhaoId: '',
    tipoMadeira: '',
    quantidadePrevistaM3: '',
    dataHoraChegadaPrevista: '',
    observacoes: '',
  })

  const [docs, setDocs] = useState({ nf: '', mdfe: '', oc: '' })

  const [transportadoras, setTransportadoras] = useState<{ id: string; nome: string }[]>([])
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: string; placa: string; tipo: string }[]>([])
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])
  const [fazendas, setFazendas] = useState<{ id: string; nome: string }[]>([])
  const [talhoes, setTalhoes] = useState<{ id: string; nome: string }[]>([])
  const [dataSaida, setDataSaida] = useState('')

  useEffect(() => {
    if (!id) return

    Promise.all([
      agendamentosService.get(id),
      cadastrosService.bundleAgendamento(),
      user?.perfil === 'motorista' ? agendamentosService.motoristaContexto().catch(() => null) : Promise.resolve(null),
    ])
      .then(([agRes, bundleRes, ctxRes]) => {
        const ag = agRes.data
        setNumero(ag.numero)
        setDataSaida(ag.dataHoraSaidaPrevista)
        setPendencias(ag.pendencias || [])
        setProntoConfirmar(!!ag.prontoConfirmar)

        setForm({
          transportadoraId: ag.transportadoraId || ctxRes?.data?.transportadoraId || '',
          motoristaId: ag.motoristaId || ctxRes?.data?.motoristaId || '',
          veiculoId: ag.veiculoId || '',
          fornecedorId: ag.fornecedorId || '',
          fazendaId: ag.fazendaId || '',
          talhaoId: ag.talhaoId || '',
          tipoMadeira: ag.tipoMadeira || '',
          quantidadePrevistaM3: ag.quantidadePrevistaM3 != null ? String(ag.quantidadePrevistaM3) : '',
          dataHoraChegadaPrevista: ag.dataHoraChegadaPrevista
            ? format(new Date(ag.dataHoraChegadaPrevista), "yyyy-MM-dd'T'HH:mm")
            : '',
          observacoes: ag.observacoes || '',
        })

        const docsList = ag.documentos || []
        setDocs({
          nf: docsList.find((d: { tipo: string }) => d.tipo === 'nota_fiscal')?.numero || '',
          mdfe: docsList.find((d: { tipo: string }) => d.tipo === 'mdfe')?.numero || '',
          oc: docsList.find((d: { tipo: string }) => d.tipo === 'ordem_carregamento')?.numero || '',
        })

        const b = bundleRes.data
        setTransportadoras(b.transportadoras)
        setMotoristas(b.motoristas)
        setVeiculos(ctxRes?.data?.veiculos?.length ? ctxRes.data.veiculos : b.veiculos)
        setFornecedores(b.fornecedores)
        setFazendas(b.fazendas)
      })
      .catch(() => setError('Erro ao carregar agendamento'))
      .finally(() => setLoading(false))
  }, [id, user?.perfil])

  useEffect(() => {
    if (form.fazendaId) {
      cadastrosService.talhoes(form.fazendaId).then((r) => setTalhoes(r.data)).catch(() => {})
    }
  }, [form.fazendaId])

  async function refreshPendencias() {
    if (!id) return
    const r = await agendamentosService.pendencias(id)
    setPendencias(r.data.pendencias)
    setProntoConfirmar(r.data.prontoConfirmar)
  }

  async function handleSalvar() {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      await agendamentosService.update(id, {
        ...form,
        quantidadePrevistaM3: form.quantidadePrevistaM3 ? parseFloat(form.quantidadePrevistaM3) : null,
        dataHoraChegadaPrevista: form.dataHoraChegadaPrevista
          ? new Date(form.dataHoraChegadaPrevista).toISOString()
          : null,
      })

      const docTasks = []
      if (docs.nf) docTasks.push(agendamentosService.saveDocumento(id, { tipo: 'nota_fiscal', numero: docs.nf }))
      if (docs.mdfe) docTasks.push(agendamentosService.saveDocumento(id, { tipo: 'mdfe', numero: docs.mdfe }))
      if (docs.oc) docTasks.push(agendamentosService.saveDocumento(id, { tipo: 'ordem_carregamento', numero: docs.oc }))
      await Promise.all(docTasks)

      await refreshPendencias()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmar() {
    if (!id) return
    setConfirming(true)
    setError('')
    try {
      await handleSalvar()
      await agendamentosService.confirmar(id, {})
      navigate('/viagens')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; pendencias?: Array<{ label: string }> } } }
      setError(e.response?.data?.error || 'Erro ao confirmar')
      if (e.response?.data?.pendencias) {
        setPendencias(e.response.data.pendencias as Array<{ label: string; grupo: string }>)
      }
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Completar agendamento" showBack backPath="/agendamento/meus">
        <p className="text-center text-gray-400 py-12">Carregando...</p>
      </PageLayout>
    )
  }

  const motoristaLocked = user?.perfil === 'motorista'

  return (
    <PageLayout
      title="Completar agendamento"
      subtitle={numero}
      showBack
      backPath="/agendamento/meus"
    >
      <Card className="mb-4 bg-forest-50 border-forest-100">
        <p className="text-sm font-bold text-forest-900">
          {format(new Date(dataSaida), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="text-xs text-forest-700 mt-1">Horário reservado · complete quando tiver os dados</p>
      </Card>

      {pendencias.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-semibold flex items-center gap-1 mb-1">
            <AlertCircle size={16} /> Pendências
          </p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {pendencias.map((p) => (
              <li key={p.label}>{p.label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4 pb-24">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-forest-600" /> Transporte
          </h3>
          <div className="space-y-3">
            <Select
              label="Transportadora"
              value={form.transportadoraId}
              onChange={(e) => setForm((f) => ({ ...f, transportadoraId: e.target.value }))}
              options={transportadoras.map((t) => ({ value: t.id, label: t.nome }))}
              disabled={motoristaLocked}
            />
            <Select
              label="Motorista"
              value={form.motoristaId}
              onChange={(e) => setForm((f) => ({ ...f, motoristaId: e.target.value }))}
              options={motoristas.map((m) => ({ value: m.id, label: m.nome }))}
              disabled={motoristaLocked}
            />
            <Select
              label="Veículo"
              value={form.veiculoId}
              onChange={(e) => setForm((f) => ({ ...f, veiculoId: e.target.value }))}
              options={veiculos.map((v) => ({ value: v.id, label: `${v.placa} · ${v.tipo}` }))}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Origem e carga</h3>
          <div className="space-y-3">
            <Select label="Fornecedor" value={form.fornecedorId} onChange={(e) => setForm((f) => ({ ...f, fornecedorId: e.target.value }))} options={fornecedores.map((x) => ({ value: x.id, label: x.nome }))} />
            <Select label="Fazenda" value={form.fazendaId} onChange={(e) => setForm((f) => ({ ...f, fazendaId: e.target.value, talhaoId: '' }))} options={fazendas.map((x) => ({ value: x.id, label: x.nome }))} />
            <Select label="Talhão" value={form.talhaoId} onChange={(e) => setForm((f) => ({ ...f, talhaoId: e.target.value }))} options={talhoes.map((x) => ({ value: x.id, label: x.nome }))} />
            <Input label="Tipo de madeira" value={form.tipoMadeira} onChange={(e) => setForm((f) => ({ ...f, tipoMadeira: e.target.value }))} />
            <Input label="Volume previsto (m³)" type="number" value={form.quantidadePrevistaM3} onChange={(e) => setForm((f) => ({ ...f, quantidadePrevistaM3: e.target.value }))} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-forest-600" /> Documentos
            <span className="text-xs font-normal text-gray-400">(pode preencher depois)</span>
          </h3>
          <div className="space-y-3">
            <Input label="Nota Fiscal" value={docs.nf} onChange={(e) => setDocs((d) => ({ ...d, nf: e.target.value }))} required={regras.requireNf} />
            <Input label="MDF-e" value={docs.mdfe} onChange={(e) => setDocs((d) => ({ ...d, mdfe: e.target.value }))} required={regras.requireMdfe} />
            <Input label="Ordem de carregamento" value={docs.oc} onChange={(e) => setDocs((d) => ({ ...d, oc: e.target.value }))} required={regras.requireLoadingOrder} />
          </div>
        </Card>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto p-4 lg:p-0 bg-white lg:bg-transparent border-t lg:border-0 border-gray-100 flex gap-2">
          <Button variant="outline" fullWidth loading={saving} onClick={handleSalvar} icon={<Save size={16} />}>
            Salvar
          </Button>
          <Button
            fullWidth
            loading={confirming}
            onClick={handleConfirmar}
            icon={<CheckCircle size={16} />}
          >
            Confirmar viagem
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
