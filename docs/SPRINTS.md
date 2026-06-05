# Sprints

## Sprint 1 — Foundations ✅
**Goal:** Build the core infrastructure before any WhatsApp logic.

| File | Description |
|---|---|
| `config/config.js` | Centralised configuration with environment variables |
| `src/utils/logger.js` | Structured logging with pino |
| `src/utils/helpers.js` | Pure utility functions |
| `src/data/database.js` | SQLite database layer |
| `src/data/contacts.js` | Excel contact loader |

## Sprint 2 — The Bot ✅
**Goal:** Build the WhatsApp connection and automation logic.

| File | Description |
|---|---|
| `src/bot/messages.js` | Message templates |
| `src/bot/whatsapp.js` | Baileys connection + QR code |
| `src/bot/groups.js` | Group management |
| `src/bot/scheduler.js` | Queue + delays + daily limit |

## Sprint 3 — Dashboard & Delivery ⬜
**Goal:** Build the dashboard, entry point and deploy to VPS.

| File | Description |
|---|---|
| `src/dashboard/server.js` | Express API + HTML dashboard |
| `index.js` | Entry point |
| Deploy | Oracle Cloud Free Tier |