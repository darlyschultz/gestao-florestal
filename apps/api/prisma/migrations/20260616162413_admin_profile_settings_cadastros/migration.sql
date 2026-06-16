-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canBlock" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL DEFAULT 'Sistema de Rastreamento Florestal',
    "unitName" TEXT NOT NULL DEFAULT 'Fábrica Verde',
    "unitCnpj" TEXT,
    "unitAddress" TEXT,
    "factoryLatitude" REAL,
    "factoryLongitude" REAL,
    "factoryGeofenceRadiusMeters" REAL NOT NULL DEFAULT 500,
    "boardingGeofenceRadiusMeters" REAL NOT NULL DEFAULT 300,
    "weightTolerancePercent" REAL NOT NULL DEFAULT 5,
    "weightToleranceKg" REAL NOT NULL DEFAULT 500,
    "stopAlertMinutes" INTEGER NOT NULL DEFAULT 30,
    "delayAlertMinutes" INTEGER NOT NULL DEFAULT 60,
    "scheduleIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "maxTrucksPerSlot" INTEGER NOT NULL DEFAULT 3,
    "requireNf" BOOLEAN NOT NULL DEFAULT true,
    "requireMdfe" BOOLEAN NOT NULL DEFAULT true,
    "requireLoadingOrder" BOOLEAN NOT NULL DEFAULT true,
    "requireBoardingLocation" BOOLEAN NOT NULL DEFAULT true,
    "requireGpsTracking" BOOLEAN NOT NULL DEFAULT true,
    "allowManualGateCheckin" BOOLEAN NOT NULL DEFAULT true,
    "allowManualBlock" BOOLEAN NOT NULL DEFAULT true,
    "operationalAlertEmail" TEXT,
    "gateOpenTime" TEXT DEFAULT '06:00',
    "gateCloseTime" TEXT DEFAULT '22:00',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySystem" BOOLEAN NOT NULL DEFAULT true,
    "notifyPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "raioCercaMetros" REAL NOT NULL DEFAULT 500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tipos_veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "capacidadeM3" REAL,
    "capacidadeKg" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tipos_madeira" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'm³',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "docas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidadeId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoMaterial" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "docas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "balancas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidadeId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "balancas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "motivos_bloqueio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'portaria',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "janelas_agendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unidadeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horarioInicial" TEXT NOT NULL,
    "horarioFinal" TEXT NOT NULL,
    "intervaloMinutos" INTEGER NOT NULL DEFAULT 15,
    "capacidadePorHorario" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "janelas_agendamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "screen" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "technicalKey" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "showWeb" BOOLEAN NOT NULL DEFAULT true,
    "showMobile" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "defaultValue" TEXT,
    "minValue" TEXT,
    "maxValue" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "custom_field_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customFieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_field_options_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customFieldId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fazendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "municipio" TEXT,
    "uf" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "raioCercaMetros" REAL NOT NULL DEFAULT 300,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fazendas_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_fazendas" ("ativo", "cidade", "createdAt", "estado", "fornecedorId", "id", "nome", "updatedAt") SELECT "ativo", "cidade", "createdAt", "estado", "fornecedorId", "id", "nome", "updatedAt" FROM "fazendas";
DROP TABLE "fazendas";
ALTER TABLE "new_fazendas" RENAME TO "fazendas";
CREATE TABLE "new_fornecedores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razaoSocial" TEXT,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "municipio" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_fornecedores" ("ativo", "cnpj", "createdAt", "email", "id", "nome", "telefone", "updatedAt") SELECT "ativo", "cnpj", "createdAt", "email", "id", "nome", "telefone", "updatedAt" FROM "fornecedores";
DROP TABLE "fornecedores";
ALTER TABLE "new_fornecedores" RENAME TO "fornecedores";
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");
CREATE TABLE "new_locais_embarque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "talhaoId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "raioMetros" REAL NOT NULL DEFAULT 200,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "locais_embarque_talhaoId_fkey" FOREIGN KEY ("talhaoId") REFERENCES "talhoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_locais_embarque" ("ativo", "createdAt", "id", "latitude", "longitude", "nome", "raioMetros", "talhaoId", "updatedAt") SELECT "ativo", "createdAt", "id", "latitude", "longitude", "nome", "raioMetros", "talhaoId", "updatedAt" FROM "locais_embarque";
DROP TABLE "locais_embarque";
ALTER TABLE "new_locais_embarque" RENAME TO "locais_embarque";
CREATE TABLE "new_motoristas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCnh" TEXT NOT NULL,
    "validadeCnh" DATETIME NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "transportadoraId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "motoristas_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_motoristas" ("ativo", "categoriaCnh", "cnh", "cpf", "createdAt", "id", "nome", "telefone", "transportadoraId", "updatedAt", "validadeCnh") SELECT "ativo", "categoriaCnh", "cnh", "cpf", "createdAt", "id", "nome", "telefone", "transportadoraId", "updatedAt", "validadeCnh" FROM "motoristas";
DROP TABLE "motoristas";
ALTER TABLE "new_motoristas" RENAME TO "motoristas";
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");
CREATE TABLE "new_talhoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fazendaId" TEXT NOT NULL,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoMadeiraId" TEXT,
    "tipoMadeira" TEXT,
    "areaHa" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "talhoes_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "fazendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "talhoes_tipoMadeiraId_fkey" FOREIGN KEY ("tipoMadeiraId") REFERENCES "tipos_madeira" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_talhoes" ("areaHa", "ativo", "createdAt", "fazendaId", "id", "nome", "tipoMadeira", "updatedAt") SELECT "areaHa", "ativo", "createdAt", "fazendaId", "id", "nome", "tipoMadeira", "updatedAt" FROM "talhoes";
DROP TABLE "talhoes";
ALTER TABLE "new_talhoes" RENAME TO "talhoes";
CREATE TABLE "new_transportadoras" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razaoSocial" TEXT,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "responsavel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_transportadoras" ("ativo", "cnpj", "createdAt", "email", "id", "nome", "telefone", "updatedAt") SELECT "ativo", "cnpj", "createdAt", "email", "id", "nome", "telefone", "updatedAt" FROM "transportadoras";
DROP TABLE "transportadoras";
ALTER TABLE "new_transportadoras" RENAME TO "transportadoras";
CREATE UNIQUE INDEX "transportadoras_cnpj_key" ON "transportadoras"("cnpj");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "roleId" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "avatar" TEXT,
    "temaPreferido" TEXT NOT NULL DEFAULT 'claro',
    "notificacoesEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificacoesPush" BOOLEAN NOT NULL DEFAULT true,
    "notificacoesSistema" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "transportadoraId" TEXT,
    "unidadeId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("ativo", "createdAt", "email", "id", "nome", "perfil", "senha", "transportadoraId", "updatedAt") SELECT "ativo", "createdAt", "email", "id", "nome", "perfil", "senha", "transportadoraId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE "new_veiculos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "placaCarreta" TEXT,
    "tipo" TEXT NOT NULL,
    "tipoVeiculoId" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "anoFabricacao" INTEGER,
    "capacidadeM3" REAL,
    "capacidadeKg" REAL,
    "transportadoraId" TEXT,
    "rastreadorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "veiculos_tipoVeiculoId_fkey" FOREIGN KEY ("tipoVeiculoId") REFERENCES "tipos_veiculo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "veiculos_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_veiculos" ("anoFabricacao", "ativo", "capacidadeM3", "createdAt", "id", "marca", "modelo", "placa", "placaCarreta", "tipo", "updatedAt") SELECT "anoFabricacao", "ativo", "capacidadeM3", "createdAt", "id", "marca", "modelo", "placa", "placaCarreta", "tipo", "updatedAt" FROM "veiculos";
DROP TABLE "veiculos";
ALTER TABLE "new_veiculos" RENAME TO "veiculos";
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_module_key" ON "permissions"("roleId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_veiculo_codigo_key" ON "tipos_veiculo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_madeira_codigo_key" ON "tipos_madeira"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "docas_unidadeId_codigo_key" ON "docas"("unidadeId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "balancas_unidadeId_codigo_key" ON "balancas"("unidadeId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "motivos_bloqueio_codigo_key" ON "motivos_bloqueio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_screen_technicalKey_key" ON "custom_fields"("screen", "technicalKey");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_customFieldId_entityType_entityId_key" ON "custom_field_values"("customFieldId", "entityType", "entityId");
