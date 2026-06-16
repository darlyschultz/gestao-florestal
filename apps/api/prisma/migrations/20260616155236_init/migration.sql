-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "transportadoraId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transportadoras" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCnh" TEXT NOT NULL,
    "validadeCnh" DATETIME NOT NULL,
    "telefone" TEXT,
    "transportadoraId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "motoristas_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "anoFabricacao" INTEGER,
    "capacidadeM3" REAL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "placaCarreta" TEXT
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fazendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fazendas_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "talhoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "areaHa" REAL,
    "tipoMadeira" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "talhoes_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "fazendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "locais_embarque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "talhaoId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "raioMetros" REAL NOT NULL DEFAULT 200,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "locais_embarque_talhaoId_fkey" FOREIGN KEY ("talhaoId") REFERENCES "talhoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "transportadoraId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "talhaoId" TEXT NOT NULL,
    "localEmbarqueId" TEXT,
    "tipoMadeira" TEXT NOT NULL,
    "quantidadePrevistaM3" REAL NOT NULL,
    "dataHoraSaidaPrevista" DATETIME NOT NULL,
    "dataHoraChegadaPrevista" DATETIME NOT NULL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agendamentos_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "fazendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_talhaoId_fkey" FOREIGN KEY ("talhaoId") REFERENCES "talhoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_localEmbarqueId_fkey" FOREIGN KEY ("localEmbarqueId") REFERENCES "locais_embarque" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viagens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "transportadoraId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "latEmbarque" REAL,
    "lngEmbarque" REAL,
    "latAtual" REAL,
    "lngAtual" REAL,
    "distanciaRestanteKm" REAL,
    "tempoRestanteMin" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "viagens_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viagens_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viagens_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "viagens_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos_viagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "arquivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documentos_viagem_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posicoes_viagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "velocidade" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "posicoes_viagem_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "posicoes_viagem_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alertas_viagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alertas_viagem_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "eventos_viagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "userId" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "eventos_viagem_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "eventos_viagem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "portaria_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portaria_checkins_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "portaria_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fila_patio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_portaria',
    "tempoEstimadoMin" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fila_patio_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pesagens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ticketBalanca" TEXT,
    "placa" TEXT NOT NULL,
    "pesoBrutoKg" REAL NOT NULL,
    "pesoTaraKg" REAL,
    "pesoLiquidoKg" REAL,
    "operador" TEXT,
    "balanca" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pesagens_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pesagens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "descargas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viagemId" TEXT NOT NULL,
    "doca" TEXT NOT NULL,
    "material" TEXT,
    "responsavel" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'liberada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "descargas_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_cnpj_key" ON "transportadoras"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_numero_key" ON "agendamentos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "viagens_numero_key" ON "viagens"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "viagens_agendamentoId_key" ON "viagens"("agendamentoId");
