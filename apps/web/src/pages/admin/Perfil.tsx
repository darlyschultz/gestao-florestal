import React, { useEffect, useState } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AvatarUpload } from '../../components/admin/AvatarUpload'
import { perfilService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export function Perfil() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cargo: '',
    temaPreferido: 'claro',
    notificacoesEmail: true, notificacoesPush: true, notificacoesSistema: true,
  })
  const [senha, setSenha] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'dados' | 'senha' | 'notificacoes'>('dados')

  useEffect(() => {
    perfilService.get().then(({ data }) => {
      setForm({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cargo: data.cargo || '',
        temaPreferido: data.temaPreferido || 'claro',
        notificacoesEmail: data.notificacoesEmail ?? true,
        notificacoesPush: data.notificacoesPush ?? true,
        notificacoesSistema: data.notificacoesSistema ?? true,
      })
    })
  }, [])

  async function handleSave() {
    setLoading(true)
    setMsg('')
    try {
      await perfilService.update(form)
      await refreshUser?.()
      setMsg('Perfil atualizado com sucesso')
    } catch {
      setMsg('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  async function handleSenha() {
    setLoading(true)
    setMsg('')
    try {
      await perfilService.alterarSenha(senha)
      setSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
      setMsg('Senha alterada com sucesso')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setMsg(err.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatar(file: File) {
    setAvatarLoading(true)
    try {
      await perfilService.uploadAvatar(file)
      await refreshUser?.()
    } finally {
      setAvatarLoading(false)
    }
  }

  const tabs = [
    { id: 'dados' as const, label: 'Dados' },
    { id: 'senha' as const, label: 'Senha' },
    { id: 'notificacoes' as const, label: 'Notificações' },
  ]

  return (
    <PageLayout
      header={<AppHeader title="Meu Perfil" showBack backPath="/menu" />}
    >
      <Card padding="lg" className="mb-4">
        <AvatarUpload
          avatar={user?.avatar}
          nome={form.nome}
          onUpload={handleAvatar}
          loading={avatarLoading}
        />
        <p className="text-center text-xs text-gray-500 mt-2 capitalize">{user?.perfil}</p>
      </Card>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setMsg('') }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-forest-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="space-y-3">
          <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          <Button fullWidth loading={loading} onClick={handleSave}>Salvar alterações</Button>
        </div>
      )}

      {tab === 'senha' && (
        <div className="space-y-3">
          <Input label="Senha atual" type="password" value={senha.senhaAtual} onChange={(e) => setSenha({ ...senha, senhaAtual: e.target.value })} />
          <Input label="Nova senha" type="password" value={senha.novaSenha} onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })} />
          <Input label="Confirmar nova senha" type="password" value={senha.confirmarSenha} onChange={(e) => setSenha({ ...senha, confirmarSenha: e.target.value })} />
          <Button fullWidth loading={loading} onClick={handleSenha}>Alterar senha</Button>
        </div>
      )}

      {tab === 'notificacoes' && (
        <div className="space-y-3">
          {[
            { key: 'notificacoesEmail' as const, label: 'Notificações por e-mail' },
            { key: 'notificacoesPush' as const, label: 'Notificações push' },
            { key: 'notificacoesSistema' as const, label: 'Notificações no sistema' },
          ].map((n) => (
            <label key={n.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
              <span className="text-sm text-gray-700">{n.label}</span>
              <input
                type="checkbox"
                checked={form[n.key]}
                onChange={(e) => setForm({ ...form, [n.key]: e.target.checked })}
                className="w-5 h-5 rounded accent-forest-700"
              />
            </label>
          ))}
          <Button fullWidth loading={loading} onClick={handleSave}>Salvar preferências</Button>
        </div>
      )}

      {msg && (
        <p className={`text-sm text-center mt-4 ${msg.includes('Erro') ? 'text-red-500' : 'text-forest-700'}`}>
          {msg}
        </p>
      )}
    </PageLayout>
  )
}
