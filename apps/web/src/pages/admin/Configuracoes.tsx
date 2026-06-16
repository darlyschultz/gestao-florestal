import React, { useEffect, useState } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { configuracoesService } from '../../services/api'

export function Configuracoes() {
  const [form, setForm] = useState<Record<string, string | number | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    configuracoesService.get().then(({ data }) => {
      setForm(data)
      setLoading(false)
    })
  }, [])

  function setField(key: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      await configuracoesService.update(form)
      setMsg('Configurações salvas com sucesso')
    } catch {
      setMsg('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLayout header={<AppHeader title="Configurações" showBack backPath="/menu" />}><p className="text-center text-gray-400 py-8">Carregando...</p></PageLayout>

  const sections = [
    {
      title: 'Empresa / Unidade',
      fields: [
        { key: 'companyName', label: 'Nome da empresa', type: 'text' },
        { key: 'unitName', label: 'Nome da unidade', type: 'text' },
        { key: 'unitCnpj', label: 'CNPJ', type: 'text' },
        { key: 'unitAddress', label: 'Endereço', type: 'text' },
      ],
    },
    {
      title: 'Geofencing',
      fields: [
        { key: 'factoryLatitude', label: 'Latitude fábrica', type: 'number' },
        { key: 'factoryLongitude', label: 'Longitude fábrica', type: 'number' },
        { key: 'factoryGeofenceRadiusMeters', label: 'Raio cerca fábrica (m)', type: 'number' },
        { key: 'boardingGeofenceRadiusMeters', label: 'Raio cerca embarque (m)', type: 'number' },
      ],
    },
    {
      title: 'Operacional',
      fields: [
        { key: 'weightTolerancePercent', label: 'Tolerância peso (%)', type: 'number' },
        { key: 'weightToleranceKg', label: 'Tolerância peso (kg)', type: 'number' },
        { key: 'stopAlertMinutes', label: 'Alerta parada (min)', type: 'number' },
        { key: 'delayAlertMinutes', label: 'Alerta atraso (min)', type: 'number' },
        { key: 'scheduleIntervalMinutes', label: 'Intervalo agenda (min)', type: 'number' },
        { key: 'maxTrucksPerSlot', label: 'Máx. caminhões/slot', type: 'number' },
        { key: 'gateOpenTime', label: 'Abertura portaria', type: 'text' },
        { key: 'gateCloseTime', label: 'Fechamento portaria', type: 'text' },
      ],
    },
    {
      title: 'Requisitos',
      checkboxes: [
        { key: 'requireNf', label: 'Exigir NF' },
        { key: 'requireMdfe', label: 'Exigir MDF-e' },
        { key: 'requireLoadingOrder', label: 'Exigir ordem de carregamento' },
        { key: 'requireBoardingLocation', label: 'Exigir local de embarque' },
        { key: 'requireGpsTracking', label: 'Exigir rastreamento GPS' },
        { key: 'allowManualGateCheckin', label: 'Permitir check-in manual' },
        { key: 'allowManualBlock', label: 'Permitir bloqueio manual' },
      ],
    },
  ]

  return (
    <PageLayout header={<AppHeader title="Configurações" subtitle="Parâmetros do sistema" showBack backPath="/menu" />}>
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title} padding="md">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">{section.title}</h3>
            <div className="space-y-3">
              {section.fields?.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => setField(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              ))}
              {section.checkboxes?.map((c) => (
                <label key={c.key} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700">{c.label}</span>
                  <input
                    type="checkbox"
                    checked={!!form[c.key]}
                    onChange={(e) => setField(c.key, e.target.checked)}
                    className="w-5 h-5 rounded accent-forest-700"
                  />
                </label>
              ))}
            </div>
          </Card>
        ))}
        <Button fullWidth loading={saving} onClick={handleSave}>Salvar configurações</Button>
        {msg && <p className={`text-sm text-center ${msg.includes('Erro') ? 'text-red-500' : 'text-forest-700'}`}>{msg}</p>}
      </div>
    </PageLayout>
  )
}
