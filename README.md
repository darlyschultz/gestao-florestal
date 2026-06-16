# Sistema de Rastreamento Florestal 🌿

Gestão inteligente para operações florestais seguras e eficientes.

## Estrutura do Projeto

```
/
├── apps/
│   ├── web/        # Frontend React + Vite + TypeScript + Tailwind CSS (PWA)
│   └── api/        # Backend Node.js + Express + TypeScript + SQLite + Prisma
├── packages/
│   └── shared/     # Tipos compartilhados
└── package.json    # Monorepo (npm workspaces)
```

## Requisitos

- Node.js 18+
- npm 8+

## Instalação

```bash
# Na raiz do projeto
npm install
```

## Banco de Dados

```bash
# Criar tabelas (já executado uma vez)
npm run db:migrate

# Popular com dados de teste
npm run db:seed

# Abrir interface visual do banco
npm run db:studio
```

## Como Rodar

### Opção 1 — Tudo junto

```bash
npm run dev
```

### Opção 2 — Separado

```bash
# Terminal 1 — API (porta 5291)
npm run dev:api

# Terminal 2 — Frontend (porta 5290)
npm run dev:web
```

Acesse: **http://localhost:5290**

## Variáveis de Ambiente

### apps/api/.env

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="florestal_jwt_secret_2024_change_in_production"
JWT_EXPIRES_IN="7d"
PORT=5291
NODE_ENV=development
```

### apps/web/.env

```env
VITE_API_URL=http://localhost:5291
VITE_MAPBOX_TOKEN=           # Opcional - deixa vazio para mapa simulado
VITE_GOOGLE_MAPS_KEY=        # Opcional - deixa vazio para mapa simulado
```

## Usuários de Teste

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@florestal.com | 123456 | Administrador |
| transportador@florestal.com | 123456 | Transportador |
| portaria@florestal.com | 123456 | Portaria |
| operacao@florestal.com | 123456 | Operação |
| motorista@florestal.com | 123456 | Motorista |

## Funcionalidades por Perfil

### Administrador
- Acesso completo ao sistema
- Gestão de usuários, transportadoras, motoristas, veículos
- Dashboard e relatórios completos

### Transportador
- Agendamento de transporte (calendário → horários → dados → documentos → local → resumo)
- Acompanhamento das próprias viagens

### Motorista
- Visualização de viagens atribuídas
- Captura de geolocalização
- Atualização de status (carregando, carregado, em trânsito)

### Portaria
- Check-in de veículos por placa/NF/agendamento
- Liberação ou bloqueio de entrada
- Controle de fila e pátio

### Operação / Balança
- Pesagem inicial
- Liberação para descarga
- Pesagem final com cálculo de divergência
- Finalização de viagens

## Fluxo Principal

```
Agendamento → Documentos → Local de Embarque → Resumo/Confirmação
     ↓
Viagem criada → Em Trânsito → Portaria (check-in) → Fila/Pátio
     ↓
Pesagem Inicial → Liberação Descarga → Descarga → Pesagem Final → Finalizado
```

## Status da Viagem

| Status | Descrição |
|--------|-----------|
| agendado | Viagem agendada |
| em_carregamento | Carregamento em curso |
| carregado | Carregamento concluído |
| em_transito | Veículo em rota |
| proximo_fabrica | Chegou na cerca virtual |
| portaria | Check-in realizado |
| em_pesagem | Pesagem em andamento |
| em_descarga | Descarga em andamento |
| finalizado | Operação concluída |
| bloqueado | Bloqueado na portaria |

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| Estilo | Tailwind CSS 3 |
| Roteamento | React Router 6 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Datas | date-fns |
| PWA | vite-plugin-pwa |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco | SQLite (dev) → PostgreSQL/MySQL (prod) |
| Auth | JWT |
| Upload | Multer |

## Migrar para PostgreSQL (Produção)

1. Altere o `schema.prisma`:
   ```
   provider = "postgresql"
   url = env("DATABASE_URL")
   ```
2. Atualize `DATABASE_URL` no `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/florestal"
   ```
3. Execute: `npm run db:migrate:prod`

## Mapa Real (Opcional)

Para usar mapa real ao invés do mapa simulado:

**Mapbox:**
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiLi4uIn0...
```

**Google Maps:**
```
VITE_GOOGLE_MAPS_KEY=AIzaSy...
```

Sem chave configurada, o sistema exibe um mapa visual simulado para desenvolvimento.
