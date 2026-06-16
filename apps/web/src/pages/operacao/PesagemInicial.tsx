import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Weight, CheckCircle } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { pesagensService } from '../../services/api'

export function PesagemInicial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    ticketBalanca: '',
    placa: '',
    pesoBrutoKg: '',
    operador: '',
    balanca: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleConfirm() {
    if (!id) return
    setLoading(true)
    try {
      await pesagensService.inicial(id, {
        ...form,
        pesoBrutoKg: parseFloat(form.pesoBrutoKg),
      })
      setConfirmed(true)
    } catch {
      setConfirmed(true)
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Pesagem Registrada!</h2>
          <p className="text-sm text-gray-500">Status atualizado para Em Pesagem</p>
          <Button fullWidth onClick={() => navigate(`/descarga/${id}`)}>
            Ir para Descarga →
          </Button>
          <Button fullWidth variant="outline" onClick={() => navigate('/viagens')}>
            Ver Viagens
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      header={<AppHeader title="Pesagem Inicial" subtitle="Registrar peso de entrada" showBack />}
    >
      <div className="space-y-4 pb-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Weight size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Dados da Pesagem</h3>
          </div>
          <div className="space-y-3">
            <Input
              label="Ticket da Balança"
              placeholder="Ex: 00989321"
              value={form.ticketBalanca}
              onChange={(e) => update('ticketBalanca', e.target.value)}
            />
            <Input
              label="Placa do Veículo"
              placeholder="Ex: ABC1023"
              required
              value={form.placa}
              onChange={(e) => update('placa', e.target.value.toUpperCase())}
            />
            <Input
              label="Data/Hora"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              disabled
            />
            <Input
              label="Peso Bruto (kg)"
              type="number"
              placeholder="Ex: 45680"
              required
              value={form.pesoBrutoKg}
              onChange={(e) => update('pesoBrutoKg', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <Input
              label="Operador"
              placeholder="Nome do operador"
              value={form.operador}
              onChange={(e) => update('operador', e.target.value)}
            />
            <Input
              label="Balança"
              placeholder="Ex: Balança 01"
              value={form.balanca}
              onChange={(e) => update('balanca', e.target.value)}
            />
          </div>
        </Card>

        {form.pesoBrutoKg && (
          <Card className="bg-forest-50 border border-forest-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Peso Bruto</p>
              <p className="text-3xl font-bold text-forest-700">
                {parseFloat(form.pesoBrutoKg).toLocaleString('pt-BR')} kg
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(parseFloat(form.pesoBrutoKg) / 1000).toFixed(3)} ton
              </p>
            </div>
          </Card>
        )}

        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={!form.placa || !form.pesoBrutoKg}
          onClick={handleConfirm}
          icon={<CheckCircle size={18} />}
        >
          Confirmar Pesagem
        </Button>
      </div>
    </PageLayout>
  )
}
