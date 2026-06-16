import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { camposService } from '../../services/api'

const FIELD_TYPES = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'observacao', label: 'Observação' },
]

const SCREENS = [
  { value: 'agendamento_novo', label: 'Agendamento — Novo' },
  { value: 'portaria_checkin', label: 'Portaria — Check-in' },
  { value: 'pesagem_inicial', label: 'Pesagem Inicial' },
  { value: 'pesagem_final', label: 'Pesagem Final' },
]

export function CamposDinamicos() {
  const [fields, setFields] = useState<Array<Record<string, unknown>>>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({ fieldType: 'texto', screen: 'agendamento_novo', module: 'agendamentos' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await camposService.list()
    setFields(data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await camposService.create({
        ...form,
        required: form.required === 'true',
        showWeb: true,
        showMobile: true,
      })
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir campo?')) return
    await camposService.delete(id)
    load()
  }

  return (
    <PageLayout
      header={
        <AppHeader
          title="Campos Dinâmicos"
          showBack
          backPath="/cadastros"
          rightContent={<Button size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Novo</Button>}
        />
      }
    >
      <div className="space-y-2">
        {fields.map((f) => (
          <Card key={String(f.id)} padding="md">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{String(f.label)}</p>
                <p className="text-xs text-gray-500">{String(f.screen)} · {String(f.fieldType)}</p>
                {Boolean(f.isSystem) && <span className="text-xs text-blue-600">Sistema</span>}
              </div>
              {!Boolean(f.isSystem) && (
                <button onClick={() => handleDelete(String(f.id))} className="p-2 text-gray-500 hover:text-red-600 rounded-lg">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Novo Campo</h2>
            <div className="space-y-3">
              <Input label="Rótulo" required value={form.label || ''} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              <Input label="Chave técnica" required value={form.technicalKey || ''} onChange={(e) => setForm({ ...form, technicalKey: e.target.value })} />
              <Select label="Tela" options={SCREENS} value={form.screen || ''} onChange={(e) => setForm({ ...form, screen: e.target.value })} />
              <Select label="Tipo" options={FIELD_TYPES} value={form.fieldType || ''} onChange={(e) => setForm({ ...form, fieldType: e.target.value })} />
              <Input label="Módulo" value={form.module || 'agendamentos'} onChange={(e) => setForm({ ...form, module: e.target.value })} />
              <Select label="Obrigatório" options={[{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim' }]} value={form.required || 'false'} onChange={(e) => setForm({ ...form, required: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" fullWidth onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button fullWidth loading={saving} onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
