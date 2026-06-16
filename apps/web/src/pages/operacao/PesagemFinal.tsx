import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Weight, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { pesagensService } from '../../services/api'

const TOLERANCIA_PERCENT = 5

export function PesagemFinal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    placa: '',
    pesoBrutoKg: '',
    pesoTaraKg: '',
    operador: '',
    balanca: '',
    ticketBalanca: '',
    quantidadePrevistaM3: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const pesoBruto = parseFloat(form.pesoBrutoKg) || 0
  const pesoTara = parseFloat(form.pesoTaraKg) || 0
  const pesoLiquido = pesoBruto - pesoTara
  const qtdPrevista = parseFloat(form.quantidadePrevistaM3) || 0
  const previstKg = qtdPrevista * 750 // estimativa eucalipto
  const divergencia = previstKg > 0 ? ((pesoLiquido - previstKg) / previstKg) * 100 : 0
  const dentrTolerancia = Math.abs(divergencia) <= TOLERANCIA_PERCENT

  async function handleFinalizar() {
    if (!id) return
    setLoading(true)
    try {
      await pesagensService.final(id, {
        ...form,
        pesoBrutoKg: pesoBruto,
        pesoTaraKg: pesoTara,
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
          <h2 className="text-lg font-bold text-gray-900">Viagem Finalizada!</h2>
          <div className="bg-white rounded-2xl shadow-card p-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Peso Líquido</span>
              <span className="text-sm font-bold text-forest-700">{pesoLiquido.toLocaleString('pt-BR')} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Divergência</span>
              <span className={`text-sm font-bold ${dentrTolerancia ? 'text-green-600' : 'text-red-600'}`}>
                {divergencia > 0 ? '+' : ''}{divergencia.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Tolerância (±5%)</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dentrTolerancia ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {dentrTolerancia ? 'Dentro da tolerância' : 'Fora da tolerância'}
              </span>
            </div>
          </div>
          <Button fullWidth onClick={() => navigate('/viagens')}>
            Ver Viagens
          </Button>
          <Button fullWidth variant="outline" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      header={<AppHeader title="Descarga e Pesagem Final" showBack />}
    >
      <div className="space-y-4 pb-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Weight size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Pesagem Final</h3>
          </div>
          <div className="space-y-3">
            <Input
              label="Placa do Veículo"
              placeholder="Ex: ABC1023"
              required
              value={form.placa}
              onChange={(e) => update('placa', e.target.value.toUpperCase())}
            />
            <Input
              label="Peso Tara (kg)"
              type="number"
              placeholder="Ex: 15860"
              required
              value={form.pesoTaraKg}
              onChange={(e) => update('pesoTaraKg', e.target.value)}
            />
            <Input
              label="Peso Bruto Final (kg)"
              type="number"
              placeholder="Ex: 43920"
              required
              value={form.pesoBrutoKg}
              onChange={(e) => update('pesoBrutoKg', e.target.value)}
            />
            <Input
              label="Quantidade Prevista (m³)"
              type="number"
              placeholder="Para calcular divergência"
              value={form.quantidadePrevistaM3}
              onChange={(e) => update('quantidadePrevistaM3', e.target.value)}
            />
          </div>
        </Card>

        {/* Resumo calculado */}
        {pesoBruto > 0 && pesoTara > 0 && (
          <Card className="bg-forest-50 border border-forest-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Peso Tara</span>
                <span className="text-sm font-bold text-gray-700">{pesoTara.toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Peso Bruto (Final)</span>
                <span className="text-sm font-bold text-gray-700">{pesoBruto.toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-forest-200">
                <span className="text-xs font-semibold text-gray-700">Peso Líquido</span>
                <span className="text-base font-bold text-forest-700">{pesoLiquido.toLocaleString('pt-BR')} kg</span>
              </div>
              {qtdPrevista > 0 && (
                <div className="flex justify-between pt-1 border-t border-forest-200">
                  <span className="text-xs text-gray-500">Divergência</span>
                  <div className="flex items-center gap-1">
                    {divergencia > 0 ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={`text-sm font-bold ${dentrTolerancia ? 'text-green-600' : 'text-red-600'}`}>
                      {divergencia > 0 ? '+' : ''}{divergencia.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {qtdPrevista > 0 && (
                <div className={`text-center py-2 rounded-xl text-xs font-semibold ${dentrTolerancia ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dentrTolerancia ? '✓ Dentro da tolerância (±5%)' : '⚠ Fora da tolerância (±5%)'}
                </div>
              )}
            </div>
          </Card>
        )}

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

        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={!form.placa || !form.pesoBrutoKg || !form.pesoTaraKg}
          onClick={handleFinalizar}
          icon={<CheckCircle size={18} />}
        >
          Finalizar Viagem
        </Button>
      </div>
    </PageLayout>
  )
}
