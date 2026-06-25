import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, KeyRound } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { usuariosService, perfisService, cadastrosService } from '../../services/api'

const PERFIS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'transportador', label: 'Transportador' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'operacao', label: 'Operação' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'gestor', label: 'Gestor' },
]

export function UsuariosAdmin() {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [transportadoras, setTransportadoras] = useState<{ value: string; label: string }[]>([])
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [usersRes, transpRes, rolesRes] = await Promise.all([
        usuariosService.list(),
        cadastrosService.transportadoras(),
        perfisService.list(),
      ])
      setUsers(usersRes.data)
      setTransportadoras(transpRes.data.map((t: { id: string; nome: string }) => ({ value: t.id, label: t.nome })))
      setRoles(rolesRes.data.map((r: { id: string; name: string }) => ({ value: r.id, label: r.name })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ perfil: 'transportador' })
    setShowForm(true)
  }

  function openEdit(u: Record<string, unknown>) {
    setEditing(u)
    setForm({
      nome: String(u.nome || ''),
      email: String(u.email || ''),
      telefone: String(u.telefone || ''),
      cargo: String(u.cargo || ''),
      perfil: String(u.perfil || ''),
      transportadoraId: String(u.transportadoraId || ''),
      roleId: String(u.roleId || ''),
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await usuariosService.update(String(editing.id), form)
      } else {
        if (!form.senha) throw new Error('Senha é obrigatória para novo usuário')
        await usuariosService.create(form)
      }
      setShowForm(false)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setError(err.response?.data?.error || err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(u: Record<string, unknown>) {
    await usuariosService.toggleStatus(String(u.id), !u.ativo)
    load()
  }

  async function resetSenha(id: string) {
    if (!confirm('Resetar senha para 123456?')) return
    await usuariosService.resetSenha(id)
    alert('Senha resetada para 123456')
  }

  const filtered = users.filter((u) =>
    !search || String(u.nome).toLowerCase().includes(search.toLowerCase()) ||
    String(u.email).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout
      title="Usuários"
      showBack
      backPath="/cadastros"
      rightContent={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Novo</Button>}
    >
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
      </div>

      {loading ? <p className="text-center text-gray-400 py-8">Carregando...</p> : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={String(u.id)} padding="md">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{String(u.nome)}</p>
                  <p className="text-xs text-gray-500 truncate">{String(u.email)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'} · {String(u.perfil)}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => resetSenha(String(u.id))} className="p-2 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-orange-50" title="Resetar senha">
                    <KeyRound size={16} />
                  </button>
                  <button onClick={() => openEdit(u)} className="p-2 text-gray-500 hover:text-forest-700 rounded-lg hover:bg-gray-100">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => toggleStatus(u)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50">
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
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar' : 'Novo'} Usuário</h2>
            <div className="space-y-3">
              <Input label="Nome" required value={form.nome || ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <Input label="E-mail" type="email" required value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {!editing && <Input label="Senha" type="password" required value={form.senha || ''} onChange={(e) => setForm({ ...form, senha: e.target.value })} />}
              <Select label="Perfil" required options={PERFIS} value={form.perfil || ''} onChange={(e) => setForm({ ...form, perfil: e.target.value })} />
              <Select label="Perfil RBAC" options={roles} value={form.roleId || ''} onChange={(e) => setForm({ ...form, roleId: e.target.value })} placeholder="Selecione perfil" />
              <Select label="Transportadora" options={transportadoras} value={form.transportadoraId || ''} onChange={(e) => setForm({ ...form, transportadoraId: e.target.value })} placeholder="Opcional" />
              <Input label="Telefone" value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              <Input label="Cargo" value={form.cargo || ''} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
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
