import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, Users, Building2, TreePine, MapPin, Factory,
  Scale, DoorOpen, Ban, Clock, Settings, Shield, FileText, ChevronRight,
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'

interface CadastroItem {
  title: string
  description: string
  to: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const cadastros: CadastroItem[] = [
  { title: 'Transportadoras', description: 'Empresas de transporte', to: '/cadastros/transportadoras', icon: <Truck size={20} /> },
  { title: 'Motoristas', description: 'Condutores cadastrados', to: '/cadastros/motoristas', icon: <Users size={20} /> },
  { title: 'Veículos', description: 'Frota de caminhões', to: '/cadastros/veiculos', icon: <Truck size={20} /> },
  { title: 'Fornecedores', description: 'Fornecedores de madeira', to: '/cadastros/fornecedores', icon: <Building2 size={20} /> },
  { title: 'Fazendas', description: 'Propriedades rurais', to: '/cadastros/fazendas', icon: <TreePine size={20} /> },
  { title: 'Talhões', description: 'Áreas de colheita', to: '/cadastros/talhoes', icon: <MapPin size={20} /> },
  { title: 'Locais de Embarque', description: 'Pontos de carregamento', to: '/cadastros/locais-embarque', icon: <MapPin size={20} /> },
  { title: 'Tipos de Madeira', description: 'Espécies e produtos', to: '/cadastros/tipos-madeira', icon: <TreePine size={20} /> },
  { title: 'Tipos de Veículo', description: 'Categorias de frota', to: '/cadastros/tipos-veiculo', icon: <Truck size={20} /> },
  { title: 'Unidades', description: 'Fábricas e unidades', to: '/cadastros/unidades', icon: <Factory size={20} /> },
  { title: 'Docas', description: 'Docas de descarga', to: '/cadastros/docas', icon: <DoorOpen size={20} /> },
  { title: 'Balanças', description: 'Balanças da unidade', to: '/cadastros/balancas', icon: <Scale size={20} /> },
  { title: 'Motivos de Bloqueio', description: 'Motivos padronizados', to: '/cadastros/motivos-bloqueio', icon: <Ban size={20} /> },
  { title: 'Janelas de Agendamento', description: 'Horários disponíveis', to: '/cadastros/janelas-agendamento', icon: <Clock size={20} /> },
  { title: 'Usuários', description: 'Contas de acesso', to: '/cadastros/usuarios', icon: <Users size={20} />, adminOnly: true },
  { title: 'Perfis e Permissões', description: 'Papéis do sistema', to: '/cadastros/perfis', icon: <Shield size={20} />, adminOnly: true },
  { title: 'Campos Dinâmicos', description: 'Campos customizados', to: '/configuracoes/campos', icon: <Settings size={20} />, adminOnly: true },
  { title: 'Auditoria', description: 'Log de alterações', to: '/auditoria', icon: <FileText size={20} />, adminOnly: true },
]

export function Cadastros() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'admin' || user?.perfil === 'gestor'

  const visible = cadastros.filter((c) => !c.adminOnly || isAdmin)

  return (
    <PageLayout header={<AppHeader title="Cadastros" subtitle="Gestão de dados base" showBack backPath="/menu" />}>
      <div className="space-y-2">
        {visible.map((item) => (
          <Card key={item.to} hover padding="md" onClick={() => navigate(item.to)}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-forest-100 text-forest-700 rounded-xl shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}
