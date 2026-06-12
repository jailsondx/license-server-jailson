# Servidor de Licenciamento NodeJS 🚀

Serviço backend em **Node.js** para ativação e validação de licenças dos meus sistemas. Ele controla se uma licença está bloqueada, a qual máquina ela pertence e quando foi a sua última verificação de uso.

## 🛠️ Tecnologias Utilizadas

- **Node.js** com ESM (`type: module`)
- **Express 5** (roteamento e servidor web)
- **Prisma ORM 6** (comunicação com o banco de dados)
- **MySQL** (banco de dados relacional)
- **CORS** (controle de acesso para requisições externas)

---

## 📁 Estrutura do Projeto

```
├── server.js                  # Entry point (Express, porta 3123)
├── prisma.config.ts           # Configuração do Prisma 6 (schema, migrations, datasource)
├── prisma/
│   ├── schema.prisma          # Schema do banco (model licenses)
│   └── prisma_commands.md     # Comandos úteis do Prisma
├── src/
│   ├── controller/prisma.js   # Instância única do PrismaClient (log: error, warn)
│   ├── routers/licencaRoutes.js   # Rotas /api/licenca
│   └── services/licencaService.js # Regras de negócio (ativar/validar)
└── .env.exemple               # Modelo do arquivo .env
```

---

## ⚙️ Funcionalidades e Regras de Negócio

O servidor expõe duas ações: **Ativação** e **Validação** de licença.

> ⚠️ **Prefixo automático:** o servidor adiciona o prefixo `HIPDV-` à chave enviada na requisição antes de buscar no banco. O cliente envia `12345-ABCDE` e o banco armazena `HIPDV-12345-ABCDE`.

### 1. Ativação (`POST /api/licenca/ativar`)
- Busca a licença pela chave (com prefixo). Se não existir → código 404.
- Se `bloqueado = true` → código 403.
- Se a licença nunca foi vinculada (`machine_id` vazio), grava o `machine_id` e `ativado_em` (primeira ativação).
- Se já estiver vinculada a outro `machine_id` → código 403.
- Se já estiver vinculada à mesma máquina → confirma a ativação.

### 2. Validação (`POST /api/licenca/validar`)
- Verifica se a licença existe, se o `machine_id` confere e se `bloqueado = false`.
- Se válida, atualiza `ultima_check` com a data/hora atual.

---

## 🗄️ Estrutura do Banco de Dados (tabela `licenses`)

Definida em `prisma/schema.prisma` (obtida via `prisma db pull` — introspecção do banco existente):

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | Chave primária (auto incremento) |
| `chave_licenca` | `String?` (único, 100) | Chave da licença (formato: `HIPDV-XXX...`) |
| `machine_id` | `String?` (único, 100) | Identificador da máquina vinculada |
| `bloqueado` | `Boolean?` (default `false`) | `true` = licença bloqueada/inativa |
| `empresa` | `String?` (100) | Nome ou identificador da empresa |
| `criado_em` | `DateTime?` (default `now()`) | Data de criação da licença |
| `ativado_em` | `DateTime?` | Data/hora da primeira ativação |
| `ultima_check` | `DateTime?` | Data/hora do último "ping" de validação |

---

## 🔧 Configuração do Prisma

O projeto usa o **`prisma.config.ts`** (padrão do Prisma 6) em vez de configurar tudo no `schema.prisma`:

- `schema`: `prisma/schema.prisma`
- `migrations.path`: `prisma/migrations`
- `datasource.url`: lida de `process.env.DATABASE_URL` (carregada via `dotenv/config`)

> 📌 O `prisma.config.ts` importa `dotenv/config`. Se ainda não estiver instalado, rode:
> ```bash
> npm install --save-dev dotenv
> ```

Comandos do fluxo de trabalho (ver `prisma/prisma_commands.md`):

```bash
npx prisma db pull    # Introspecciona o banco e atualiza o schema.prisma
npx prisma generate   # Gera/atualiza o Prisma Client
```

---

## 🚀 Como instalar e rodar localmente

### 1. Pré-requisitos
- **Node.js** instalado
- **MySQL** rodando
- **Git** (opcional, para clonar)

### 2. Configuração do ambiente

```bash
npm install
```

Crie um arquivo `.env` na raiz (use o `.env.exemple` como base):

```env
DATABASE_URL="mysql://USUARIO_BANCO:SENHA_BANCO@IP_BANCO:PORTA_BANCO/NOME_DO_BANCO"
```

### 3. Prisma

```bash
npx prisma generate
# Banco já existente: npx prisma db pull (atualiza o schema a partir do banco)
# Banco vazio: npx prisma db push (cria a tabela a partir do schema)
```

### 4. Inicialização

```bash
npm run dev
```

> 🌐 O servidor sobe na porta **3123** (`http://localhost:3123/`).

---

## 📡 API Endpoints

> ⚠️ **Sobre os status HTTP:** o servidor responde **HTTP 200** quando `success: true` e **HTTP 500** quando `success: false`. O código de negócio real (200, 403, 404, 500) vem no campo **`code`** do corpo JSON — o cliente deve tratar pelo `code`/`success`, não apenas pelo status HTTP.

### `POST /api/licenca/ativar`
Ativa uma licença numa máquina, vinculando a chave ao `machine_id` na primeira ativação.

**Body (JSON):**
```json
{
  "chave_licenca": "12345-ABCDE",
  "machine_id": "M-88990022"
}
```
*(A API busca internamente por `HIPDV-12345-ABCDE`.)*

**Resposta de sucesso (HTTP 200):**
```json
{
  "code": 200,
  "message": "Licença ativada com sucesso",
  "data": {
    "chave_licenca": "HIPDV-12345-ABCDE",
    "machine_id": "M-88990022",
    "bloqueado": false,
    "ativado_em": "2026-06-11T12:00:00.000Z"
  }
}
```

**Códigos de negócio (`code` no body):**
- `200`: Licença ativada (ou já ativada na mesma máquina).
- `403`: Licença bloqueada ou já vinculada a outra máquina.
- `404`: Licença não encontrada.
- `500`: Erro interno ou licença sem data de ativação.

### `POST /api/licenca/validar`
Chamada periódica para confirmar que o cliente ainda pode usar o software. Atualiza `ultima_check` quando válida.

**Body (JSON):**
```json
{
  "chave_licenca": "12345-ABCDE",
  "machine_id": "M-88990022"
}
```

**Códigos de negócio (`code` no body):**
- `200`: Licença válida (`ultima_check` atualizada).
- `403`: `machine_id` não confere ou licença bloqueada.
- `404`: Licença não encontrada.
- `500`: Erro interno.
