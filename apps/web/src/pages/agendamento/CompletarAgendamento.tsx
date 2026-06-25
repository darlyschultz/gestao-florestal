import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CheckCircle, FileText, Save, Truck } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { UploadBox } from '../../components/ui/UploadBox'
import { agendamentosService, cadastrosService } from '../../services/api'
import { resolveAssetUrl } from '../../utils/apiBase'
import { useAgendamentoRegras } from '../../hooks/useAgendamentoRegras'
import { useAuth } from '../../contexts/AuthContext'
import {
  labelVeiculo,
  listasTransporte,
  type ContextoFormularioAgendamento,
  type VeiculoOption,
} from '../../utils/agendamentoFormContext'

interface DocField {
  numero: string
  arquivo: File | null
  nomeArquivo: string
  arquivoUrl?: string
  removerAnexo?: boolean
}

function docFromServer(doc?: { numero?: string | null; arquivo?: string | null }): DocField {
  const url = doc?.arquivo || undefined
  return {
    numero: doc?.numero || '',
    arquivo: null,
    nomeArquivo: url ? (url.split('/').pop() || 'Anexo') : '',
    arquivoUrl: url,
  }
}

function DocumentoCampo({
  title,
  required,
  doc,
  onChange,
}: {
  title: string
  required?: boolean
  doc: DocField
  onChange: (patch: Partial<DocField>) => void
}) {
  const viewUrl = doc.arquivoUrl && !doc.arquivo && !doc.removerAnexo ? resolveAssetUrl(doc.arquivoUrl) : null

  return (
    <div className="space-y-3 pt-3 first:pt-0 border-t first:border-t-0 border-gray-100">
      <p className="text-sm font-medium text-gray-700">
        {title}
        {required && <span className="text-xs text-red-500 font-medium ml-1">(Obrigatório)</span>}
      </p>
      <Input
        label="Número"
        value={doc.numero}
        onChange={(e) => onChange({ numero: e.target.value })}
        required={required}
      />
      {doc.nomeArquivo ? (
        <UploadBox
          fileName={doc.nomeArquivo}
          status="pendente"
          onRemove={() => onChange({ arquivo: null, nomeArquivo: '', removerAnexo: true, arquivoUrl: undefined })}
        />
      ) : (
        <UploadBox
          label="Anexar documento"
          onFileSelect={(f) => onChange({ arquivo: f, nomeArquivo: f.name, removerAnexo: false })}
          helper="PDF, JPG ou PNG (opcional)"
        />
      )}
      {viewUrl && (
        <a
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-forest-600 underline"
        >
          Ver anexo salvo
        </a>
      )}
    </div>
  )
}

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

  const [docs, setDocs] = useState<{ nf: DocField; mdfe: DocField; oc: DocField }>({
    nf: docFromServer(),
    mdfe: docFromServer(),
    oc: docFromServer(),
  })

  const [bundle, setBundle] = useState<{
    transportadoras: { id: string; nome: string }[]
    motoristas: { id: string; nome: string; transportadoraId?: string }[]
    veiculos: VeiculoOption[]
  } | null>(null)
  const [ctx, setCtx] = useState<ContextoFormularioAgendamento | null>(null)
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])
  const [fazendas, setFazendas] = useState<{ id: string; nome: string }[]>([])
  const [talhoes, setTalhoes] = useState<{ id: string; nome: string }[]>([])
  const [dataSaida, setDataSaida] = useState('')

  useEffect(() => {
    if (!id) return

    Promise.all([
      agendamentosService.get(id),
      cadastrosService.bundleAgendamento(),
      agendamentosService.contextoFormulario().catch(() => ({ data: null })),
    ])
      .then(([agRes, bundleRes, ctxRes]) => {
        const ag = agRes.data
        const b = bundleRes.data
        const contexto = ctxRes.data as ContextoFormularioAgendamento | null
        setBundle(b)
        setCtx(contexto)
        setNumero(ag.numero)
        setDataSaida(ag.dataHoraSaidaPrevista)
        setPendencias(ag.pendencias || [])
        setProntoConfirmar(!!ag.prontoConfirmar)

        setForm({
          transportadoraId: ag.transportadoraId || contexto?.transportadoraId || '',
          motoristaId: ag.motoristaId || contexto?.motoristaId || '',
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
          nf: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'nota_fiscal')),
          mdfe: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'mdfe')),
          oc: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'ordem_carregamento')),
        })


        setFornecedores(b.fornecedores)
        setFazendas(b.fazendas)

        if (!ag.veiculoId && contexto?.veiculos?.length === 1) {
          setForm((f) => ({ ...f, veiculoId: contexto.veiculos![0].id }))
        }
        if (!ag.motoristaId && contexto?.motoristaId) {
          setForm((f) => ({
            ...f,
            motoristaId: contexto.motoristaId!,
            transportadoraId: f.transportadoraId || contexto.transportadoraId || '',
          }))
        }
      })
      .catch(() => setError('Erro ao carregar agendamento'))
      .finally(() => setLoading(false))
  }, [id, user?.perfil])

  const listas = useMemo(() => {
    if (!bundle) return { transportadoras: [], motoristas: [], veiculos: [] }
    return listasTransporte(ctx, bundle, form.transportadoraId)
  }, [bundle, ctx, form.transportadoraId])

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

  async function saveDocField(tipo: string, field: DocField) {
    if (!id) return
    const hasNumero = field.numero.trim().length > 0
    const hasFile = !!field.arquivo
    const hasUrl = !!field.arquivoUrl && !field.removerAnexo
    if (!hasNumero && !hasFile && !hasUrl && !field.removerAnexo) return

    if (field.removerAnexo && !hasFile) {
      await agendamentosService.uploadDocumento(id, {
        tipo,
        numero: field.numero || undefined,
        arquivoUrl: '',
      })
      return
    }

    await agendamentosService.uploadDocumento(id, {
      tipo,
      numero: field.numero || undefined,
      file: field.arquivo || undefined,
      arquivoUrl: hasUrl ? field.arquivoUrl : undefined,
    })
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

      await Promise.all([
        saveDocField('nota_fiscal', docs.nf),
        saveDocField('mdfe', docs.mdfe),
        saveDocField('ordem_carregamento', docs.oc),
      ])

      const agAtualizado = await agendamentosService.get(id)
      const docsList = agAtualizado.data.documentos || []
      setDocs({
        nf: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'nota_fiscal')),
        mdfe: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'mdfe')),
        oc: docFromServer(docsList.find((d: { tipo: string }) => d.tipo === 'ordem_carregamento')),
      })

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

  const bloquearTransportadora = !!ctx?.bloquearTransportadora
  const bloquearMotorista = !!ctx?.bloquearMotorista

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
        <p className="text-xs text-forest-700 mt-1">Horário confirmado · complete os dados e gere a viagem</p>
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
              onChange={(e) => setForm((f) => ({ ...f, transportadoraId: e.target.value, motoristaId: bloquearMotorista ? f.motoristaId : '', veiculoId: '' }))}
              options={listas.transportadoras.map((t) => ({ value: t.id, label: t.nome }))}
              disabled={bloquearTransportadora}
            />
            <Select
              label="Motorista"
              value={form.motoristaId}
              onChange={(e) => setForm((f) => ({ ...f, motoristaId: e.target.value }))}
              options={listas.motoristas.map((m) => ({ value: m.id, label: m.nome }))}
              disabled={bloquearMotorista}
            />
            <Select
              label="Veículo"
              value={form.veiculoId}
              onChange={(e) => setForm((f) => ({ ...f, veiculoId: e.target.value }))}
              options={listas.veiculos.map((v) => ({ value: v.id, label: labelVeiculo(v) }))}
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
          <div className="space-y-1">
            <DocumentoCampo
              title="Nota Fiscal"
              required={regras.requireNf}
              doc={docs.nf}
              onChange={(patch) => setDocs((d) => ({ ...d, nf: { ...d.nf, ...patch } }))}
            />
            <DocumentoCampo
              title="MDF-e"
              required={regras.requireMdfe}
              doc={docs.mdfe}
              onChange={(patch) => setDocs((d) => ({ ...d, mdfe: { ...d.mdfe, ...patch } }))}
            />
            <DocumentoCampo
              title="Ordem de carregamento"
              required={regras.requireLoadingOrder}
              doc={docs.oc}
              onChange={(patch) => setDocs((d) => ({ ...d, oc: { ...d.oc, ...patch } }))}
            />
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
            Gerar viagem
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
