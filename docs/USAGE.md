# 📖 Como Usar o WhatsCommunityBoosterAI

## Antes de começar

Tens de ter preparado:

- ✅ Node.js 18+ instalado
- ✅ Um chip secundário dedicado (Vodacom, Mcel ou Movitel) — este é o número do bot
- ✅ O ficheiro Excel com os contactos em `data/contacts.xlsx`
- ✅ O ficheiro `.env` preenchido (ver abaixo)

---

## 1. Configurar o `.env`

Copia o ficheiro de exemplo:

```bash
cp .env.example .env
```

Abre o `.env` e preenche os campos:

| Campo | Descrição | Exemplo |
|---|---|---|
| `BOT_NAME` | Nome do bot | WhatsCommunityBoosterAI |
| `ADMIN_NUMBER` | Teu número pessoal — recebe o relatório diário | 258840000000 |
| `DEFAULT_GROUP_ID` | ID do grupo principal — deixa vazio por agora | |
| `DELAY_MIN` | Delay mínimo entre mensagens em ms (45s) | 45000 |
| `DELAY_MAX` | Delay máximo entre mensagens em ms (120s) | 120000 |
| `DAILY_LIMIT` | Máximo de mensagens por dia | 20 |
| `DASHBOARD_PORT` | Porta do painel web | 3000 |
| `DASHBOARD_PASSWORD` | Senha do painel web | umasenhaforte |
| `REPORT_TIME` | Hora do relatório diário (formato 24h) | 20:00 |
| `NODE_ENV` | Ambiente | development |

> ⚠️ O `.env` nunca vai para o GitHub — contém informação sensível.

---

## 2. Preparar o Excel de contactos

Coloca o teu ficheiro Excel em `data/contacts.xlsx`.

O ficheiro pode ter estas colunas:

**Formato simples — um grupo:**

| phone | name |
|---|---|
| 258841234567 | João Silva |
| 258842345678 | Maria Santos |

**Formato multi-grupo:**

| phone | name | group |
|---|---|---|
| 258841234567 | João Silva | Viaturas SUV |
| 258842345678 | Maria Santos | Viaturas Económicas |

> ℹ️ Os nomes das colunas são detectados automaticamente. Podes usar `phone`, `numero`, `number` ou `telef` para o número.

---

## 3. Instalar dependências

```bash
npm install
```

---

## 4. Primeiro arranque — ligar o número do bot

```bash
npm start
```

Vai aparecer um QR Code no terminal:  O QRcode Abaixo é só um exemplo.
📱 Scan this QR Code with your secondary WhatsApp number:
█████████████████
█ ▄▄▄▄▄ █▀▄ ▄  ██
█ █   █ █▄▀ ▀ █ █
█ █ █ █   █  █  █
█      ██  █    █
█  █ █    █ █   █ 
█████████████████


**Como fazer o scan:**

1. Pega no telemóvel com o chip secundário
2. Abre o WhatsApp desse número
3. Vai a **Definições → Dispositivos Ligados → Ligar um dispositivo**
4. Aponta a câmara ao QR Code no terminal
5. Aguarda a confirmação

Após o scan, o terminal mostra:

INFO: WhatsApp connection established
INFO: Groups fetched successfully
INFO: Scheduler started
INFO: Bot is running and ready


> ✅ A sessão fica guardada na pasta `auth_info_baileys/` — não precisas de fazer scan novamente nos arranques seguintes.

---

## 5. Descobrir o ID do grupo

Para o bot adicionar contactos ao grupo correcto, precisas do ID do grupo.

Após o primeiro arranque, o bot lista automaticamente todos os grupos no terminal:


INFO: Group found: "Viaturas SUV" → 120363XXXXXXXXXX@g.us
INFO: Group found: "Viaturas Económicas" → 120363XXXXXXXXXX@g.us

Copia o ID do teu grupo principal e cola no `.env`:

```env
DEFAULT_GROUP_ID=120363XXXXXXXXXX@g.us
```

Reinicia o bot:

```bash
npm start
```

---

## 6. Aceder ao painel web

Abre o browser e vai a: http://localhost:3000

Introduz a senha que definiste em `DASHBOARD_PASSWORD`.

O painel mostra em tempo real:
- Total de contactos carregados
- Mensagens enviadas hoje
- Respostas recebidas hoje
- Contactos adicionados ao grupo
- Log de actividade recente
- Lista completa de contactos com estado

---

## 7. Relatório diário

Todos os dias à hora definida em `REPORT_TIME`, o teu número pessoal (`ADMIN_NUMBER`) recebe uma mensagem WhatsApp com o resumo do dia:

WhatsCommunityBoosterAI – Daily Report (2026-06-05)
📨 Messages Sent: 20
💬 Replies: 14
➕ Added to Groups: 14
❌ Failed: 0
📈 Success Rate: 70%
Group Breakdown:

Viaturas SUV: 8
Viaturas Económicas: 6

Status: Operational 🟢

---

## 8. Actualizar a lista de contactos

Sempre que quiseres adicionar novos contactos:

1. Abre o `data/contacts.xlsx`
2. Adiciona os novos números
3. Guarda o ficheiro

O bot detecta automaticamente os novos contactos a cada 30 minutos e adiciona-os à fila.

---

## ⚠️ Regras anti-ban

Para proteger o número do bot:

- Nunca ultrapassar **20 adições por dia** (configurável em `DAILY_LIMIT`)
- O bot espera entre **45 e 120 segundos** entre cada mensagem
- Só adiciona ao grupo quem **respondeu** à mensagem de saudação
- Usa **sempre um número secundário** — nunca o teu número pessoal

---

## 🔴 Se o bot for banido

1. O ban afecta só o chip secundário — o teu número pessoal está seguro
2. Compra um novo chip
3. Apaga a pasta `auth_info_baileys/`
4. Corre `npm start` e faz scan com o novo número