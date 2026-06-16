import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form.email, form.senha)
      navigate('/menu')
    } catch {
      setError('Email ou senha inválidos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogins = [
    { label: 'Admin', email: 'admin@florestal.com' },
    { label: 'Transp.', email: 'transportador@florestal.com' },
    { label: 'Portaria', email: 'portaria@florestal.com' },
    { label: 'Operação', email: 'operacao@florestal.com' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700 flex flex-col max-w-lg mx-auto">
      {/* Top decoration */}
      <div className="absolute top-0 left-0 right-0 max-w-lg mx-auto h-64 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
              <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white text-center leading-tight">
            Sistema de<br />Rastreamento Florestal
          </h1>
          <p className="text-forest-300 text-sm mt-1 text-center">
            Gestão inteligente para operações<br />florestais seguras e eficientes.
          </p>
        </div>

        {/* Card login */}
        <div className="w-full bg-white rounded-3xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Acesse sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuário"
              type="email"
              placeholder="Digite seu usuário"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              leftIcon={<Mail size={16} />}
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                />
                <span className="text-sm text-gray-600">Lembrar meu acesso</span>
              </label>
              <button type="button" className="text-sm text-forest-600 font-medium hover:text-forest-800">
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <Shield size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} icon={<Shield size={18} />}>
              Entrar
            </Button>
          </form>

          {/* Quick login para dev */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Acesso rápido (dev) • senha: 123456</p>
            <div className="grid grid-cols-4 gap-2">
              {quickLogins.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => setForm({ email: q.email, senha: '123456' })}
                  className="text-xs py-2 px-2 bg-gray-50 hover:bg-forest-50 text-gray-600 hover:text-forest-700 rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-forest-400 text-xs flex items-center gap-1">
          <Shield size={12} />
          Acesso seguro e monitorado
        </p>
      </div>
    </div>
  )
}
