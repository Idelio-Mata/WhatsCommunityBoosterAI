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

## Sprint 3 — Dashboard & Delivery ✅
**Goal:** Build the dashboard, entry point and deploy to VPS.

| File | Description |
|---|---|
| `src/dashboard/server.js` | Express API + HTML dashboard |
| `index.js` | Entry point |
| Deploy | Oracle Cloud Free Tier |






---

## Improvements & New Features

These are enhancements added after the initial release, not part of the original sprint plan.

---

### v1.1.0 — Google Sheets Integration ⬜

**Problem:**

In the current implementation, the contacts file (`contacts.xlsx`) lives directly on the server. This creates a critical usability problem for the client: every time they want to add new contacts, they have to send the updated file to the developer, who then manually uploads it to the server. This dependency makes the client unable to operate independently, slows down the growth of their WhatsApp groups, and creates unnecessary back-and-forth communication.

**Solution:**

Replace the local Excel file with a Google Sheets spreadsheet owned and managed by the client. The bot connects to the Google Sheets API and automatically pulls the latest contacts every 30 minutes. The client simply opens their Google Sheet, adds new numbers, and the bot picks them up on the next sync cycle — no developer intervention required.

**Benefits:**

- ✅ Client is fully autonomous — no need to contact the developer to add contacts
- ✅ Google Sheets is familiar — no new tools to learn
- ✅ Changes are instant — client adds a number and it's picked up within 30 minutes
- ✅ Access control — client can share the sheet with team members if needed
- ✅ History — Google Sheets keeps a version history of all changes

**Scope:**

| File | Description |
|---|---|
| `src/data/sheets.js` | Google Sheets API integration |
| `src/data/contacts.js` | Updated to support Google Sheets as data source |
| `docs/GOOGLE_SHEETS_SETUP.md` | Step-by-step guide to configure Google Sheets API |


### v1.2.0 — Group Member Management ⬜

**Problem:**

The client has no way to remove inactive or unwanted members from their WhatsApp groups. Doing it manually one by one is time-consuming, especially when managing groups with hundreds of members. There is also no visibility into who is currently in each group.

**Solution:**

Add a group member management section to the dashboard. The client can view all current members of each group, remove them individually or in bulk, with the same anti-ban protection already used for additions — randomized delays between each removal action.

**Benefits:**

- ✅ Client can clean up groups without manual work
- ✅ Same anti-ban protection as additions
- ✅ Full visibility of group members
- ✅ Bulk removal with filters — remove by date added, by status, or select manually

**Scope:**

| File | Description |
|---|---|
| `src/bot/groups.js` | Add removeContactFromGroup and bulkRemove functions |
| `src/bot/scheduler.js` | Add removal queue with anti-ban delays |
| `src/dashboard/server.js` | Add group members API routes |
| `src/dashboard/server.js` | Add member management UI to dashboard |