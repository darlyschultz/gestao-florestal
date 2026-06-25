import axios from 'axios'
import { getApiBase } from '../utils/apiBase'

const api = axios.create({
  baseURL: getApiBase(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authService = {
  login: (email: string, senha: string) =>
    api.post('/api/auth/login', { email, senha }),
  me: () => api.get('/api/auth/me'),
}

// Agendamentos
export const agendamentosService = {
  list: (params?: object) => api.get('/api/agendamentos', { params }),
  regras: () => api.get('/api/agendamentos/regras'),
  disponibilidade: (data: string) =>
    api.get('/api/agendamentos/disponibilidade', { params: { data } }),
  calendarioResumo: (mes: string) =>
    api.get('/api/agendamentos/calendario-resumo', { params: { mes } }),
  horariosOcupados: (data: string) =>
    api.get('/api/agendamentos/ocupados', { params: { data } }),
  get: (id: string) => api.get(`/api/agendamentos/${id}`),
  pendencias: (id: string) => api.get(`/api/agendamentos/${id}/pendencias`),
  create: (data: object) => api.post('/api/agendamentos', data),
  preAgendar: (data: { transportadoraId?: string; horarios: string[]; motoristaId?: string; veiculoId?: string }) =>
    api.post('/api/agendamentos/pre-agendar', data),
  update: (id: string, data: object) => api.put(`/api/agendamentos/${id}`, data),
  confirmar: (id: string, data?: object) => api.post(`/api/agendamentos/${id}/confirmar`, data),
  listDocumentos: (id: string) => api.get(`/api/agendamentos/${id}/documentos`),
  saveDocumento: (id: string, data: { tipo: string; numero?: string; arquivo?: string }) =>
    api.post(`/api/agendamentos/${id}/documentos`, data),
  motoristaContexto: () => api.get('/api/agendamentos/motorista/contexto'),
}

// Viagens
export const viagensService = {
  list: (params?: object) => api.get('/api/viagens', { params }),
  mapaFrota: () => api.get('/api/viagens/rastreamento/mapa'),
  get: (id: string) => api.get(`/api/viagens/${id}`),
  updateStatus: (id: string, data: object) => api.put(`/api/viagens/${id}/status`, data),
  historico: (id: string) => api.get(`/api/viagens/${id}/historico`),
  alertas: (id: string) => api.get(`/api/viagens/${id}/alertas`),
  registrarPosicao: (id: string, data: object) => api.post(`/api/viagens/${id}/posicao`, data),
  posicoes: (id: string) => api.get(`/api/viagens/${id}/posicoes`),
}

// Documentos
export const documentosService = {
  list: (viagemId: string) => api.get(`/api/documentos/viagens/${viagemId}`),
  upload: (viagemId: string, data: FormData) =>
    api.post(`/api/documentos/viagens/${viagemId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validar: (id: string, data: object) => api.put(`/api/documentos/${id}/validar`, data),
}

// Portaria
export const portariaService = {
  listAgendamentos: (params?: object, config?: object) =>
    api.get('/api/portaria/agendamentos', { params, ...config }),
  buscar: (q: string) => api.get('/api/portaria/buscar', { params: { q } }),
  checkin: (viagemId: string) => api.post(`/api/portaria/${viagemId}/checkin`),
  liberar: (viagemId: string) => api.post(`/api/portaria/${viagemId}/liberar`),
  bloquear: (viagemId: string, motivo: string) =>
    api.post(`/api/portaria/${viagemId}/bloquear`, { motivo }),
}

// Fila
export const filaService = {
  list: () => api.get('/api/fila'),
  resumo: () => api.get('/api/fila/resumo'),
  get: (id: string) => api.get(`/api/fila/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/api/fila/${id}/status`, { status }),
}

// Pesagens
export const pesagensService = {
  inicial: (viagemId: string, data: object) =>
    api.post(`/api/pesagens/viagens/${viagemId}/inicial`, data),
  final: (viagemId: string, data: object) =>
    api.post(`/api/pesagens/viagens/${viagemId}/final`, data),
}

// Descargas
export const descargasService = {
  liberar: (viagemId: string, data: object) =>
    api.post(`/api/descargas/viagens/${viagemId}/liberar`, data),
  finalizar: (viagemId: string) =>
    api.post(`/api/descargas/viagens/${viagemId}/finalizar`),
}

// Dashboard
export const dashboardService = {
  operacional: () => api.get('/api/dashboard/operacional'),
  indicadores: (params?: object) => api.get('/api/dashboard/indicadores', { params }),
}

// Cadastros
export const cadastrosService = {
  bundleAgendamento: () => api.get('/api/cadastros/bundle/agendamento'),
  transportadoras: (all?: boolean) => api.get('/api/cadastros/transportadoras', { params: all ? { all: true } : {} }),
  motoristas: (all?: boolean) => api.get('/api/cadastros/motoristas', { params: all ? { all: true } : {} }),
  veiculos: (all?: boolean) => api.get('/api/cadastros/veiculos', { params: all ? { all: true } : {} }),
  fornecedores: (all?: boolean) => api.get('/api/cadastros/fornecedores', { params: all ? { all: true } : {} }),
  fazendas: (all?: boolean) => api.get('/api/cadastros/fazendas', { params: all ? { all: true } : {} }),
  talhoes: (fazendaId?: string) =>
    api.get('/api/cadastros/talhoes', { params: { fazendaId } }),
  locaisEmbarque: (talhaoId?: string) =>
    api.get('/api/cadastros/locais-embarque', { params: { talhaoId } }),
  unidades: () => api.get('/api/cadastros/unidades'),
  tiposMadeira: () => api.get('/api/cadastros/tipos-madeira'),
  tiposVeiculo: () => api.get('/api/cadastros/tipos-veiculo'),
}

// Perfil
export const perfilService = {
  get: () => api.get('/api/perfil'),
  update: (data: object) => api.put('/api/perfil', data),
  alterarSenha: (data: object) => api.put('/api/perfil/senha', data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/api/perfil/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// Configurações
export const configuracoesService = {
  get: () => api.get('/api/configuracoes'),
  update: (data: object) => api.put('/api/configuracoes', data),
}

// Usuários
export const usuariosService = {
  list: (params?: object) => api.get('/api/usuarios', { params }),
  get: (id: string) => api.get(`/api/usuarios/${id}`),
  create: (data: object) => api.post('/api/usuarios', data),
  update: (id: string, data: object) => api.put(`/api/usuarios/${id}`, data),
  toggleStatus: (id: string, ativo: boolean) => api.put(`/api/usuarios/${id}/status`, { ativo }),
  resetSenha: (id: string, senha?: string) => api.put(`/api/usuarios/${id}/resetar-senha`, { senha }),
}

// Perfis RBAC
export const perfisService = {
  list: () => api.get('/api/perfis'),
  get: (id: string) => api.get(`/api/perfis/${id}`),
  create: (data: object) => api.post('/api/perfis', data),
  update: (id: string, data: object) => api.put(`/api/perfis/${id}`, data),
  updatePermissions: (id: string, permissions: object[]) => api.put(`/api/perfis/${id}/permissoes`, { permissions }),
}

// Campos dinâmicos
export const camposService = {
  list: (params?: object) => api.get('/api/configuracoes/campos', { params }),
  getValores: (params: object) => api.get('/api/configuracoes/campos/valores', { params }),
  create: (data: object) => api.post('/api/configuracoes/campos', data),
  update: (id: string, data: object) => api.put(`/api/configuracoes/campos/${id}`, data),
  delete: (id: string) => api.delete(`/api/configuracoes/campos/${id}`),
  saveValores: (data: object) => api.post('/api/configuracoes/campos/valores', data),
}

// Auditoria
export const auditoriaService = {
  list: (params?: object) => api.get('/api/auditoria', { params }),
}
