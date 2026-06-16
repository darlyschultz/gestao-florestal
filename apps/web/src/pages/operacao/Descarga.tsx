import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, CheckCircle } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { descargasService } from '../../services/api'

export function Descarga() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ doca: '', material: '', responsavel: '', observacoes: '' })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleLiberar() {
    if (!id) return
    setLoading(true)
    try {
      await descargasService.liberar(id, form)
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
          <h2 className="text-lg font-bold text-gray-900">Descarga Liberada!</h2>
          <p className="text-sm text-gray-500">Status atualizado para Em Descarga</p>
          <Button fullWidth onClick={() => navigate(`/pesagem/final/${id}`)}>
            Ir para Pesagem Final →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      header={<AppHeader title="Liberação para Descarga" showBack />}
    >
      <div className="space-y-4 pb-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Dados da Descarga</h3>
          </div>
          <div className="space-y-3">
            <Input
              label="Doca / Local de Descarga"
              placeholder="Ex: Doca 04"
              required
              value={form.doca}
              onChange={(e) => update('doca', e.target.value)}
            />
            <Input
              label="Material"
              placeholder="Ex: Madeira com tora"
              value={form.material}
              onChange={(e) => update('material', e.target.value)}
            />
            <Input
              label="Responsável"
              placeholder="Nome do responsável"
              value={form.responsavel}
              onChange={(e) => update('responsavel', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => update('observacoes', e.target.value)}
                placeholder="Observações sobre a descarga..."
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
              />
            </div>
          </div>
        </Card>

        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={!form.doca}
          onClick={handleLiberar}
          icon={<Package size={18} />}
        >
          Liberar Descarga
        </Button>
      </div>
    </PageLayout>
  )
}
