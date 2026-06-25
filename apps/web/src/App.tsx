import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages
import { Login } from './pages/Login'
import { Menu } from './pages/Menu'
import { Dashboard } from './pages/Dashboard'
import { Relatorios } from './pages/Relatorios'

// Agendamento
import { Calendario } from './pages/agendamento/Calendario'
import { Horarios } from './pages/agendamento/Horarios'
import { NovoAgendamento } from './pages/agendamento/NovoAgendamento'
import { Documentos } from './pages/agendamento/Documentos'
import { LocalEmbarque } from './pages/agendamento/LocalEmbarque'
import { Resumo } from './pages/agendamento/Resumo'
import { MeusAgendamentos } from './pages/agendamento/MeusAgendamentos'
import { CompletarAgendamento } from './pages/agendamento/CompletarAgendamento'

// Viagens
import { MinhasViagens } from './pages/viagens/MinhasViagens'
import { DetalheViagem } from './pages/viagens/DetalheViagem'
import { RastreamentoMapa } from './pages/viagens/RastreamentoMapa'
import { AlertasViagem } from './pages/viagens/AlertasViagem'
import { HistoricoViagem } from './pages/viagens/HistoricoViagem'
import { MapaFrota } from './pages/mapa/MapaFrota'
import { CarregamentoArea } from './pages/area/CarregamentoArea'

// Portaria
import { PortariaPage } from './pages/portaria/PortariaPage'

// Operação
import { FilaPatio } from './pages/operacao/FilaPatio'
import { PesagemInicial } from './pages/operacao/PesagemInicial'
import { Descarga } from './pages/operacao/Descarga'
import { PesagemFinal } from './pages/operacao/PesagemFinal'

// Admin
import { Perfil } from './pages/admin/Perfil'
import { Configuracoes } from './pages/admin/Configuracoes'
import { Cadastros } from './pages/admin/Cadastros'
import { CadastroEntityPage } from './pages/admin/cadastroConfigs'
import { UsuariosAdmin } from './pages/admin/UsuariosAdmin'
import { PerfisAdmin } from './pages/admin/PerfisAdmin'
import { CamposDinamicos } from './pages/admin/CamposDinamicos'
import { Auditoria } from './pages/admin/Auditoria'

function CadastroRoute() {
  const { entity } = useParams<{ entity: string }>()
  if (!entity) return <Navigate to="/cadastros" replace />
  return <CadastroEntityPage entity={entity} />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
              <path d="M24 4 L36 20 H28 L38 34 H26 V44 H22 V34 H10 L20 20 H12 Z" fill="white" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PerfilRoute({
  children,
  allowedPerfis,
}: {
  children: React.ReactNode
  allowedPerfis: string[]
}) {
  const { user } = useAuth()
  if (!user || !allowedPerfis.includes(user.perfil)) {
    return <Navigate to="/menu" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/menu" replace /> : <Login />} />

      <Route path="/" element={<PrivateRoute><Navigate to="/menu" replace /></PrivateRoute>} />
      <Route path="/menu" element={<PrivateRoute><Menu /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />

      {/* Perfil e Admin */}
      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      <Route path="/configuracoes/campos" element={<PrivateRoute><CamposDinamicos /></PrivateRoute>} />
      <Route path="/cadastros" element={<PrivateRoute><Cadastros /></PrivateRoute>} />
      <Route path="/cadastros/usuarios" element={<PrivateRoute><UsuariosAdmin /></PrivateRoute>} />
      <Route path="/cadastros/perfis" element={<PrivateRoute><PerfisAdmin /></PrivateRoute>} />
      <Route path="/cadastros/:entity" element={<PrivateRoute><CadastroRoute /></PrivateRoute>} />
      <Route path="/auditoria" element={<PrivateRoute><Auditoria /></PrivateRoute>} />

      {/* Agendamento */}
      <Route path="/agendamento/calendario" element={<PrivateRoute><Calendario /></PrivateRoute>} />
      <Route path="/agendamento/horarios" element={<PrivateRoute><Horarios /></PrivateRoute>} />
      <Route path="/agendamento/novo" element={<PrivateRoute><NovoAgendamento /></PrivateRoute>} />
      <Route path="/agendamento/documentos" element={<PrivateRoute><Documentos /></PrivateRoute>} />
      <Route path="/agendamento/local-embarque" element={<PrivateRoute><LocalEmbarque /></PrivateRoute>} />
      <Route path="/agendamento/resumo" element={<PrivateRoute><Resumo /></PrivateRoute>} />
      <Route path="/agendamento/meus" element={<PrivateRoute><MeusAgendamentos /></PrivateRoute>} />
      <Route path="/agendamento/completar/:id" element={<PrivateRoute><CompletarAgendamento /></PrivateRoute>} />

      {/* Viagens */}
      <Route path="/viagens" element={<PrivateRoute><MinhasViagens /></PrivateRoute>} />
      <Route path="/viagens/:id" element={<PrivateRoute><DetalheViagem /></PrivateRoute>} />
      <Route path="/viagens/:id/mapa" element={<PrivateRoute><RastreamentoMapa /></PrivateRoute>} />
      <Route path="/viagens/:id/alertas" element={<PrivateRoute><AlertasViagem /></PrivateRoute>} />
      <Route path="/viagens/:id/historico" element={<PrivateRoute><HistoricoViagem /></PrivateRoute>} />

      {/* Mapa frota — motorista não tem acesso */}
      <Route
        path="/mapa"
        element={
          <PrivateRoute>
            <PerfilRoute allowedPerfis={['admin', 'transportador', 'portaria', 'operacao', 'gestor']}>
              <MapaFrota />
            </PerfilRoute>
          </PrivateRoute>
        }
      />

      {/* Carregamento na área */}
      <Route
        path="/area/carregamento"
        element={
          <PrivateRoute>
            <PerfilRoute allowedPerfis={['operador_area', 'admin', 'gestor']}>
              <CarregamentoArea />
            </PerfilRoute>
          </PrivateRoute>
        }
      />

      {/* Portaria */}
      <Route path="/portaria" element={<PrivateRoute><PortariaPage /></PrivateRoute>} />

      {/* Operação */}
      <Route path="/fila-patio" element={<PrivateRoute><FilaPatio /></PrivateRoute>} />
      <Route path="/pesagem/inicial/:id" element={<PrivateRoute><PesagemInicial /></PrivateRoute>} />
      <Route path="/descarga/:id" element={<PrivateRoute><Descarga /></PrivateRoute>} />
      <Route path="/pesagem/final/:id" element={<PrivateRoute><PesagemFinal /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
