# Servidor de Licenciamento NodeJS 🚀

Este é um serviço backend desenvolvido em **Node.js** para gerenciar a validação e ativação de licenças de um SAAS (Software as a Service). Ele gerencia de forma segura se uma licença está ativa, a qual máquina ela pertence e quando foi a sua última verificação de uso.

## 🛠️ Tecnologias Utilizadas

- **Node.js** com ESM (`type: module`)
- **Express.js** (Roteamento e Servidor Web)
- **Prisma ORM** (Comunicação com o banco de dados)
- **MySQL** (Banco de dados relacional)
- **CORS** (Controle de acesso para requisições externas)

---

## ⚙️ Funcionalidades e Regras de Negócio

Este servidor gerencia duas principais ações relacionadas às licenças: **Ativação** e **Validação**. 
Uma peculiaridade importante da regra de negócios é que o servidor automaticamente adiciona um prefixo (`HIPDV-`) à chave de licença enviada nas requisições antes de buscar no banco de dados.

### 1. Ativação de Licença (`/api/licenca/ativar`)
O sistema verifica se a licença existe e se o status é `ativo`. Se a licença nunca foi vinculada a uma máquina, ele registra o `machine_id` da máquina atual. Caso essa licença já esteja atrelada a outro `machine_id`, o acesso será negado (403).

### 2. Validação de Licença (`/api/licenca/validar`)
A verificação valida se a licença informada existe, se tem um status de `ativo` e se o `machine_id` informado corresponde exatamente ao `machine_id` vinculado na ativação. Se estiver tudo certo, a data da `ultima_check` no banco de dados será atualizada com a data e hora atuais.

---

## 🗄️ Estrutura do Banco de Dados (Tabela `licenses`)

O Prisma ORM gerencia uma tabela chamada `licenses` com a seguinte estrutura:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `Int` | Chave primária (auto incremento) |
| `chave_licenca` | `String` | Chave única da licença (formato: `HIPDV-XXX...`) |
| `machine_id` | `String` | Identificador único do dispositivo que usa a licença |
| `status` | `String` | Status da licença (padrão: `ativo`) |
| `empresa` | `String` | Nome ou identificador da empresa |
| `criado_em` | `DateTime` | Data de criação da licença |
| `ativado_em` | `DateTime` | Data e hora exata de quando a licença foi ativada |
| `ultima_check` | `DateTime` | Data e hora do último "ping" de validação vindo do cliente |

---

## 🚀 Como instalar e rodar localmente

### 1. Pré-requisitos
- **Node.js** instalado
- **MySQL** rodando
- **Git** (opcional, para clonar)

### 2. Configuração do ambiente

Clone o projeto e rode o npm install caso não tenha feito:
```bash
npm install
```

Crie um arquivo `.env` na raiz do projeto (use o `.env.exemple` como base):

```env
DATABASE_URL="mysql://USUARIO_BANCO:SENHA_BANCO@IP_BANCO:PORTA_BANCO/NOME_DO_BANCO"
```

### 3. Banco de Dados (Prisma)
Atualize ou gere o client do Prisma para ler o schema do banco de dados:

```bash
npx prisma generate
# Se precisar subir as tabelas do schema para um BD vazio, use:
# npx prisma db push
```

### 4. Inicialização

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

> 🌐 O servidor vai inicializar na porta **3123**. Você poderá testar através de `http://localhost:3123/`.

---

## 📡 API Endpoints

Abaixo estão os payloads e repostas esperadas para consumo da API.

### `POST /api/licenca/ativar`
Ativa uma licença numa máquina e atrela a chave ao ID na primeira submissão.

**Body de Requisição (JSON):**
```json
{
  "chave_licenca": "12345-ABCDE", 
  "machine_id": "M-88990022"
}
```
*(Lembrete: A API adicionará o prefixo, buscando ou operando sob `HIPDV-12345-ABCDE` internamente).*

**Possíveis Respostas:**
- `200 OK`: Licença ativada (ou já ativada com sucesso correspondente na mesma máquina).
- `403 Forbidden`: Licença inativa, bloqueada, ou já vinculada a outra máquina.
- `404 Not Found`: Licença não encontrada.

### `POST /api/licenca/validar`
Chamada corriqueira para garantir que o cliente ainda tem acesso a utilizar o software.

**Body de Requisição (JSON):**
```json
{
  "chave_licenca": "12345-ABCDE",
  "machine_id": "M-88990022"
}
```

**Possíveis Respostas:**
- `200 OK`: Licença válida e última checagem (`ultima_check`) atualizada.
- `403 Forbidden`: ID de máquina incorreto ou licença bloqueada/inativa.
- `404 Not Found`: Licença não encontrada.
