import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageLayout } from '../layout/PageLayout'
import { AppHeader } from '../layout/AppHeader'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { getApiBase } from '../../utils/apiBase'

export interface CrudField {
  key: string
  label: string
  type?: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  loadOptions?: () => Promise<{ value: string; label: string }[]>
  displayKey?: string
}

export interface CrudConfig {
  title: string
  subtitle?: string
  backPath?: string
  apiPath: string
  searchKeys?: string[]
  fields: CrudField[]
  listLabel: (item: Record<string, unknown>) => string
  listSub?: (item: Record<string, unknown>) => string
}

interface CrudPageProps {
  config: CrudConfig
}

export function CrudPage({ config }: CrudPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [fieldOptions, setFieldOptions] = useState<Record<string, { value: string; label: string }[]>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const apiBase = getApiBase()

  async function loadItems() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${apiBase}/api/cadastros/${config.apiPath}?all=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [config.apiPath])

  useEffect(() => {
    config.fields.forEach(async (field) => {
      if (field.loadOptions) {
        const opts = await field.loadOptions()
        setFieldOptions((prev) => ({ ...prev, [field.key]: opts }))
      }
    })
  }, [config])

  function openCreate() {
    setEditing(null)
    setForm({})
    setError('')
    setShowForm(true)
  }

  function openEdit(item: Record<string, unknown>) {
    setEditing(item)
    const initial: Record<string, string> = {}
    config.fields.forEach((f) => {
      const val = item[f.key]
      if (val != null) initial[f.key] = String(val).slice(0, 10).includes('T') && f.type === 'date'
        ? String(val).slice(0, 10)
        : String(val)
    })
    setForm(initial)
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const body: Record<string, unknown> = {}
      config.fields.forEach((f) => {
        const val = form[f.key]
        if (val !== undefined && val !== '') {
          body[f.key] = f.type === 'number' ? Number(val) : val
        }
      })

      const url = editing
        ? `${apiBase}/api/cadastros/${config.apiPath}/${editing.id}`
        : `${apiBase}/api/cadastros/${config.apiPath}`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      setShowForm(false)
      loadItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este registro?')) return
    const token = localStorage.getItem('token')
    await fetch(`${apiBase}/api/cadastros/${config.apiPath}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    loadItems()
  }

  const filtered = items.filter((item) => {
    if (!search) return true
    const keys = config.searchKeys || config.fields.map((f) => f.key)
    return keys.some((k) => String(item[k] ?? '').toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <PageLayout
      header={
        <AppHeader
          title={config.title}
          subtitle={config.subtitle}
          showBack
          backPath={config.backPath || '/cadastros'}
          rightContent={
            <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>
              Novo
            </Button>
          }
        />
      }
    >
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Nenhum registro encontrado</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={String(item.id)} padding="md">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 truncate">{config.listLabel(item)}</p>
                  {config.listSub && (
                    <p className="text-xs text-gray-500 truncate">{config.listSub(item)}</p>
                  )}
                  {item.active === false && (
                    <span className="text-xs text-red-500">Inativo</span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-2 text-gray-500 hover:text-forest-700 rounded-lg hover:bg-gray-100">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(String(item.id))} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Editar' : 'Novo'} — {config.title}
            </h2>
            <div className="space-y-3">
              {config.fields.map((field) => {
                if (field.type === 'select') {
                  const opts = field.options || fieldOptions[field.key] || []
                  return (
                    <Select
                      key={field.key}
                      label={field.label}
                      required={field.required}
                      options={opts}
                      value={form[field.key] || ''}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={`Selecione ${field.label.toLowerCase()}`}
                    />
                  )
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                      <textarea
                        value={form[field.key] || ''}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  )
                }
                return (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.type || 'text'}
                    required={field.required}
                    value={form[field.key] || ''}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                )
              })}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
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
