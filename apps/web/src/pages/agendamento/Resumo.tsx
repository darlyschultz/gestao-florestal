import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, Calendar, Truck, MapPin, FileText, Scale } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { agendamentosService, cadastrosService } from '../../services/api'

export function Resumo() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const { form, documentos, localEmbarque } = state

  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [numeroViagem, setNumeroViagem] = useState('')

  const [transportadora, setTransportadora] = useState('')
  const [motorista, setMotorista] = useState('')
  const [veiculo, setVeiculo] = useState('')
  const [fazenda, setFazenda] = useState('')
  const [talhao, setTalhao] = useState('')

  useEffect(() => {
    if (!form) return
    Promise.all([
      cadastrosService.transportadoras(),
      cadastrosService.motoristas(),
      cadastrosService.veiculos(),
      cadastrosService.fazendas(),
      cadastrosService.talhoes(),
    ]).then(([t, m, v, f, ta]) => {
      setTransportadora(t.data.find((x: { id: string; nome: string }) => x.id === form.transportadoraId)?.nome || '')
      setMotorista(m.data.find((x: { id: string; nome: string }) => x.id === form.motoristaId)?.nome || '')
      setVeiculo(v.data.find((x: { id: string; placa: string }) => x.id === form.veiculoId)?.placa || '')
      setFazenda(f.data.find((x: { id: string; nome: string }) => x.id === form.fazendaId)?.nome || '')
      setTalhao(ta.data.find((x: { id: string; nome: string }) => x.id === form.talhaoId)?.nome || '')
    }).catch(console.error)
  }, [form])

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await agendamentosService.create({
        ...form,
        quantidadePrevistaM3: parseFloat(form.quantidadePrevistaM3),
        dataHoraSaidaPrevista: new Date(form.dataHoraSaidaPrevista).toISOString(),
        dataHoraChegadaPrevista: form.dataHoraChegadaPrevista
          ? new Date(form.dataHoraChegadaPrevista).toISOString()
          : undefined,
      })

      await agendamentosService.confirmar(res.data.id, {
        latitude: localEmbarque?.latitude,
        longitude: localEmbarque?.longitude,
      })

      setNumeroViagem(res.data.numero)
      setConfirmed(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao confirmar agendamento. Verifique o horário selecionado.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agendamento Confirmado!</h2>
            <p className="text-gray-500 mt-1 text-sm">Sua viagem foi criada com sucesso.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs text-gray-500 mb-1">Guia de Agendamento</p>
            <p className="text-lg font-bold text-forest-700">{numeroViagem}</p>
          </div>
          <div className="space-y-3 pt-2">
            <Button fullWidth size="lg" onClick={() => navigate('/viagens')}>
              Ver Minhas Viagens
            </Button>
            <Button fullWidth size="lg" variant="outline" onClick={() => navigate('/menu')}>
              Voltar ao Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      header={
        <AppHeader title="Resumo e Confirmação" subtitle="Confirme os dados da viagem" showBack />
      }
    >
      <div className="space-y-4 pb-4">
        {/* Datas */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Agendamento</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Guia</span>
              <span className="text-sm font-medium text-gray-700">Será gerado</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Saída Prevista</span>
              <span className="text-sm font-medium text-gray-700">
                {form?.dataHoraSaidaPrevista
                  ? format(new Date(form.dataHoraSaidaPrevista), "dd/MM/yyyy - HH:mm", { locale: ptBR })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-gray-500">Chegada Prevista</span>
              <span className="text-sm font-medium text-gray-700">
                {form?.dataHoraChegadaPrevista
                  ? format(new Date(form.dataHoraChegadaPrevista), "dd/MM/yyyy - HH:mm", { locale: ptBR })
                  : '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* Transportadora/Motorista */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Transportadora</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Transportadora</span>
              <span className="text-sm font-medium text-gray-700">{transportadora || '...'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Motorista</span>
              <span className="text-sm font-medium text-gray-700">{motorista || '...'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Placa</span>
              <span className="text-sm font-bold text-forest-700">{veiculo || '...'}</span>
            </div>
          </div>
        </Card>

        {/* Origem */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Origem</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Fazenda</span>
              <span className="text-sm font-medium text-gray-700">{fazenda || '...'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Talhão</span>
              <span className="text-sm font-medium text-gray-700">{talhao || '...'}</span>
            </div>
            {localEmbarque?.latitude && (
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-500">Coordenadas</span>
                <span className="text-xs font-mono text-gray-600">
                  {localEmbarque.latitude.toFixed(5)}, {localEmbarque.longitude.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Madeira */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Carga</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Tipo de Madeira</span>
              <span className="text-sm font-medium text-gray-700">{form?.tipoMadeira || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Quantidade Prevista</span>
              <span className="text-sm font-bold text-forest-700">
                {form?.quantidadePrevistaM3} m³
              </span>
            </div>
          </div>
        </Card>

        {/* Documentos */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Documentos</h3>
          </div>
          <div className="space-y-2">
            {documentos?.notaFiscal?.numero && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">Nota Fiscal</span>
                <span className="text-sm font-medium text-gray-700">{documentos.notaFiscal.numero}</span>
              </div>
            )}
            {documentos?.mdfe?.numero && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500">MDF-e</span>
                <span className="text-sm font-medium text-gray-700">{documentos.mdfe.numero}</span>
              </div>
            )}
            {documentos?.ordemCarregamento?.numero && (
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-500">Ordem de Carregamento</span>
                <span className="text-sm font-medium text-gray-700">{documentos.ordemCarregamento.numero}</span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <CheckCircle size={12} className="text-green-500" />
              Todos os documentos pendentes de validação
            </p>
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
        )}

        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={handleConfirm}
          icon={<CheckCircle size={18} />}
        >
          Confirmar Agendamento
        </Button>
      </div>
    </PageLayout>
  )
}
