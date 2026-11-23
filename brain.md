# 🧠 Smart Dan Peti – System Architecture & Knowledge Blueprint (brain.md)

> **Document Version:** 2.0.0  
> **Last Updated:** 2026-11-23  
> **Classification:** Project Technical Knowledge Base & Blueprint  
> **System:** Smart Dan Peti (Smart Donation Box & Temple Trust Financial Governance Platform)  
> **Target Environment:** Node.js v26+, Express.js 4, React 19, Vite 8, MySQL 8.0+ / FreeDB

---

## 📌 Executive Summary

**Smart Dan Peti** is an IoT-enabled Smart Donation Box and Financial Governance platform designed for temple trusts, shrines, gurdwaras, and charitable foundations. It bridges traditional sacred physical sanctum offerings with modern digital accountability, real-time IoT load-cell telemetry, optical spectral banknote validation, UPI/QR digital donations, automated Indian Income Tax Section 80G compliance receipts, and multi-signature dual-custody cash clearance.

**Architecture Principle:** 100% live-database-driven UI. All mock/static/hardcoded data has been removed. Every KPI, table, and counter reflects genuine MySQL data.

---

## 🗏️ High-Level System Architecture

```mermaid
graph TD
    subgraph "Devotee & Donor Touchpoints"
        Devotee["Devotee / Donor"]
        Kiosk["Physical Smart Dan Peti Box<br/>(Touchscreen + UPI Display + Bill Slot)"]
        WebPortal["Web / Mobile Portal<br/>(Online Donations & Sankalp)"]
    end

    subgraph "Hardware & IoT Sensors (Physical Box)"
        LoadCell["Strain-Gauge Load Cell (Weight)"]
        OpticalSensor["Optical/Spectral Banknote Validator"]
        TamperSensor["Lid Micro-Switch / Tilt Gyro"]
        BatteryMonitor["Battery & Power Telemetry"]
    end

    subgraph "Backend API (Node.js & Express)"
        Gateway["Express Gateway (Port 5000)"]
        AuthMiddleware["JWT & RBAC Middleware"]
        Controllers["Controllers: Auth, Device, Donations, Detections, Stats, Expenses, Sankalps"]
        DBPool["MySQL2 Connection Pool<br/>(Auto Schema Migration & Keep-Alive)"]
    end

    subgraph "Persistence Tier (MySQL 8.0 / FreeDB)"
        DB[("MySQL Database<br/>(freedb_T8zrBxcy)")]
    end

    subgraph "Frontend Client (React 19 + Vite 8)"
        AdminPortal["Admin & Trustee Portal"]
        CountingRoom["Cash Denomination Counting Room"]
        DigitalLedger["Online Payments & 80G E-Receipts"]
    end

    Devotee -->|Drops Cash / Scans QR| Kiosk
    Devotee -->|Online UPI / Cards| WebPortal
    Kiosk --> LoadCell & OpticalSensor & TamperSensor & BatteryMonitor
    LoadCell & OpticalSensor & TamperSensor -->|HTTP Telemetry / Sensor Events| Gateway
    WebPortal --> Gateway
    AdminPortal & CountingRoom & DigitalLedger -->|REST API / Bearer JWT| Gateway
    Gateway --> AuthMiddleware --> Controllers --> DBPool --> DB
```

---

## 💻 Technology Stack

### 1. Frontend
- **Framework:** React 19 (`19.3.1`), React DOM (`19.3.1`)
- **Build Tool:** Vite 8 (`8.3.4`) with `@vitejs/plugin-react`
- **Iconography:** `lucide-react` (50+ icons used across dashboards)
- **Visual FX:** `canvas-confetti` (for successful donation/recording celebrations)
- **Styling:** Modular CSS system with dynamic theme variables (`--gold-primary`, `--sandstone-bg`, glassmorphic cards, responsive grids)
- **State Management:** React Context API (`AuthContext`, `NotificationContext`), `localStorage` persistence with remote database hydration.

### 2. Backend
- **Runtime:** Node.js v26+ (ES6 Modules & CommonJS)
- **Framework:** Express.js 4 (`4.21.2`)
- **Database Driver:** `mysql2` (`3.12.0`) with Promise-based connection pooling
- **Security & Tokens:** `jsonwebtoken` (`9.0.2`), `bcryptjs` (`2.4.3`)
- **QR Code Engine:** `qrcode` (`1.5.4`) for dynamic UPI QR strings and verification URLs
- **Cross-Origin Handling:** `cors` (`2.8.5`) configured for all frontend ports

### 3. Database & Hosting
- **Engine:** MySQL 8.0+
- **Live Remote Host:** `sql.freedb.tech:3306`
- **Assigned Database:** `freedb_T8zrBxcy`
- **Charset:** `utf8mb4` with `utf8mb4_unicode_ci` collation
- **Free Tier Note:** FreeDB deletes databases after 4 weeks of inactivity. Keep the backend connection alive or ping regularly.

---

## 🗄️ Database Architecture & Schema Dictionary

The system schema resides in [`database/schema.sql`](file:///c:/Pruthvi/smart-dan-peti/database/schema.sql) and is automatically synchronized on startup via [`backend/config/db.js`](file:///c:/Pruthvi/smart-dan-peti/backend/config/db.js) and [`database/initDb.js`](file:///c:/Pruthvi/smart-dan-peti/database/initDb.js).

### All 12 Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Admin, trustee, counter staff accounts with RBAC | `id`, `username`, `password_hash`, `role`, `full_name`, `email` |
| `smart_boxes` | Physical IoT donation box fleet registry | `id`, `box_id`, `location_name`, `weight_kg`, `fill_pct`, `status`, `last_telemetry_at` |
| `causes` | Seva fund / donation categories (Annadanam, Goshala etc.) | `id`, `name`, `description`, `target_amount`, `collected_amount`, `is_active` |
| `donations` | Every donation transaction (cash + online) | `id`, `receipt_number`, `donor_name`, `donor_pan`, `amount`, `payment_mode`, `cause_id`, `box_id`, `is_80g_eligible`, `created_at` |
| `sankalps` | Dedicated spiritual vows with donor offerings | `id`, `devotee_name`, `occasion`, `amount`, `cause_id`, `donation_id`, `created_at` |
| `expenses` | Trust expense disbursements with approval chain | `id`, `title`, `vendor_name`, `amount`, `category`, `approved_by`, `payment_date`, `receipt_url` |
| `pending_detections` | Optical sensor banknote scan queue awaiting counter review | `id`, `box_id`, `denomination`, `confidence_score`, `serial_snippet`, `detection_time`, `status` |
| `cash_emptying_logs` | Dual-custody cash box emptying events | `id`, `box_id`, `officer1_id`, `officer2_id`, `amount_counted`, `emptied_at`, `notes` |
| `cash_denominations` | Current denomination breakdown in counting room | `denomination_key` (PK), `label`, `count`, `value`, `updated_at` |
| `audit_logs` | Immutable tamper-evident statutory event ledger | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at` |
| `system_alerts` | IoT-triggered alarms (tamper, overweight, battery) | `id`, `box_id`, `alert_type`, `severity`, `message`, `is_resolved`, `created_at` |
| `app_settings` | Global trust configuration singleton (row id=1) | `id`, `trust_name`, `tax_80g_number`, `upi_vpa`, `weight_threshold_kg`, `fill_alert_pct`, `demo_mode_enabled`, `auto_approve_threshold`, `currency_symbol` |

```mermaid
erDiagram
    users ||--o{ audit_logs : creates
    users ||--o{ cash_emptying_logs : authorizes
    users ||--o{ expenses : approves
    users ||--o{ pending_detections : reviews
    smart_boxes ||--o{ donations : receives
    smart_boxes ||--o{ pending_detections : generates
    smart_boxes ||--o{ cash_emptying_logs : emptied_via
    smart_boxes ||--o{ system_alerts : triggers
    causes ||--o{ donations : categorizes
    causes ||--o{ sankalps : dedicates
    donations ||--o{ sankalps : fulfills
```

### Current Database State (as of 2026-11-23)
```
users:               5 rows  ✅ (preserved — admin + staff accounts)
app_settings:        0 rows  (re-seed via admin settings panel)
smart_boxes:         0 rows  (re-seed via device management page)
causes:              0 rows  (re-seed via causes management page)
donations:           0 rows
sankalps:            0 rows
expenses:            0 rows
pending_detections:  0 rows
cash_emptying_logs:  0 rows
cash_denominations:  0 rows  (auto-populated on first counting room submit)
audit_logs:          0 rows
system_alerts:       0 rows
```

> **Note:** All rows except `users` were intentionally cleared on 2026-11-23 to remove seeded demo data. The 5 user accounts are live and functional. Re-seed `smart_boxes`, `causes`, and `app_settings` through the admin UI before recording new donations.

---

## 🌐 Environment Configuration

### Backend Environment File ([`backend/.env`](file:///c:/Pruthvi/smart-dan-peti/backend/.env))

> ⚠️ **This file is in `.gitignore` and will NOT be pushed to GitHub.** Use `backend/.env.example` as the template.

```env
PORT=5000
DATABASE_URL=mysql://u_Wl75mG:CcgGtOQKJCfm@sql.freedb.tech:3306/freedb_T8zrBxcy
DB_HOST=sql.freedb.tech
DB_USER=u_Wl75mG
DB_PASSWORD=CcgGtOQKJCfm
DB_NAME=freedb_T8zrBxcy
DB_PORT=3306
DB_SSL=false
JWT_SECRET=smart_dan_peti_super_secret_jwt_key_2026
UPI_VPA=smartdanpeti@upi
UPI_PAYEE_NAME=Smart Dan Peti Trust
```

### Template ([`backend/.env.example`](file:///c:/Pruthvi/smart-dan-peti/backend/.env.example))

```env
PORT=5000
DATABASE_URL=mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:3306/YOUR_DB_NAME
DB_HOST=YOUR_DB_HOST
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
DB_PORT=3306
DB_SSL=false
JWT_SECRET=change_this_to_a_long_random_secret
UPI_VPA=your_upi_id@bank
UPI_PAYEE_NAME=Your Trust Name
```

### `.gitignore` Rules

```
node_modules/        # Both root and backend/node_modules excluded
.env                 # Real credentials never pushed
.env.local
*.log
dist/
dist-ssr/
.vscode/
.idea/
.DS_Store
```

---

## 📁 Project File Structure

```
smart-dan-peti/
├── brain.md                        # This file — project knowledge base
├── package.json                    # Root orchestration scripts
├── dev.js                          # Concurrent backend+frontend starter
├── database/
│   ├── schema.sql                  # Complete 12-table MySQL DDL
│   └── initDb.js                   # Migration runner + initial seed logic
├── backend/
│   ├── .env                        # 🔒 Real credentials (gitignored)
│   ├── .env.example                # Safe template for new developers
│   ├── package.json
│   ├── server.js                   # Express entry point
│   ├── config/
│   │   └── db.js                   # MySQL2 pool + auto schema init
│   ├── middleware/
│   │   └── auth.js                 # JWT verify + RBAC role guard
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── boxRoutes.js
│   │   ├── causeRoutes.js
│   │   ├── donationRoutes.js
│   │   ├── detectionRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── sanklpRoutes.js
│   │   ├── statsRoutes.js
│   │   └── settingsRoutes.js
│   └── controllers/
│       ├── authController.js
│       ├── boxController.js
│       ├── causeController.js       # ✏️ Modified: removed mock causes
│       ├── donationController.js    # ✏️ Modified: full DB persistence, no mocks
│       ├── statsController.js       # ✏️ Modified: live DB queries, no mockStats
│       ├── detectionController.js
│       ├── expenseController.js
│       ├── sanklpController.js
│       └── settingsController.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── api/
│       │   └── client.js            # ✏️ Modified: fallbackData returns empty arrays/zeros
│       ├── context/
│       │   ├── AuthContext.jsx      # ✏️ Modified: no hardcoded demo admin fallback
│       │   └── NotificationContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── ReceiptModal.jsx
│       │   └── ...
│       └── pages/
│           ├── LoginPage.jsx
│           ├── Dashboard.jsx
│           ├── CountingDashboard.jsx     # ✏️ Modified: DEFAULT_DENOMINATIONS=zeros, DB-driven
│           ├── OnlinePaymentsPage.jsx    # ✏️ Modified: DEFAULT_ONLINE_DONATIONS removed
│           ├── DonationHistoryPage.jsx
│           ├── AnalyticsPage.jsx
│           ├── DeviceSettingsPage.jsx
│           └── AuditLogsPage.jsx
```

---

## 🔌 REST API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Get current user profile |

### Smart Boxes (IoT Fleet)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/boxes` | Bearer | List all registered smart boxes |
| POST | `/api/boxes` | Admin | Register new box |
| PUT | `/api/boxes/:id` | Admin | Update box config / telemetry |
| DELETE | `/api/boxes/:id` | Admin | Decommission box |

### Causes (Seva Funds)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/causes` | Bearer | List all active causes |
| POST | `/api/causes` | Admin | Create new cause |
| PUT | `/api/causes/:id` | Admin | Update cause |

### Donations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/donations` | Bearer | Paginated donation history |
| POST | `/api/donations` | Bearer | Record new donation + generate receipt |
| GET | `/api/donations/:id` | Bearer | Single donation details |

### Statistics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/stats` | Bearer | Aggregate KPIs (total collected, donors, 80G eligible, etc.) |
| GET | `/api/stats/denominations` | Bearer | Live denomination breakdown from `cash_denominations` |

### Expenses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/expenses` | Bearer | All expenses with approval details |
| POST | `/api/expenses` | Admin | Log new expense |

### Cash Denominations (Counting Room)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/donations/cash-denominations` | Bearer | Current denomination counts |
| PUT | `/api/donations/cash-denominations` | Bearer | Update denomination counts (upsert) |

### Settings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/settings` | Bearer | Get trust global settings |
| PUT | `/api/settings` | Admin | Update trust settings |

---

## 🛠️ Run Commands & Automation

| Command | Action |
|---|---|
| `npm run dev` | Starts full-stack development (Backend `:5000`, Frontend `:5174`) via `dev.js` |
| `npm run init-db` | Executes `database/initDb.js` — creates all 12 tables and seeds baseline data |
| `npm run dev:backend` | Starts backend only with live watch mode |
| `npm run dev:frontend` | Starts Vite frontend only |
| `npm run build` | Compiles production-ready frontend bundle |

---

## 🔑 Known Credentials & Live System Info

| Item | Value |
|---|---|
| DB Host | `sql.freedb.tech:3306` |
| DB Name | `freedb_T8zrBxcy` |
| DB User | `u_Wl75mG` *(lowercase L, not digit 1)* |
| DB Password | `CcgGtOQKJCfm` |
| FreeDB Plan | Free — expires in 4 weeks from last activity |
| GitHub Repo | `https://github.com/radhikapatadiya1612-dot/smart-dan-peti.git` |
| Backend Port | `5000` (fallback `5001+`) |
| Frontend Port | `5174` (Vite) |

---

## 🔧 Key Bug Fixes Applied

| Issue | Fix Applied |
|---|---|
| `u_W175mG` access denied on FreeDB | Correct user is `u_Wl75mG` (lowercase L, not digit 1) |
| `statsController.js` TS errors 1005/8016 — SQL `AS` clauses misread as TS type assertions | Rewrote all template literal SQL queries as string concatenation |
| `&&` not valid in PowerShell command chaining | Use `;` as separator instead |
| `cash_denominations` table missing from DB | Added table to `schema.sql`, re-ran `initDb.js` |
| `api.saveDenominations` undefined call in CountingDashboard | Fixed to call `api.updateCashDenominations` |
| `backend/node_modules` tracked in git | Added `backend/node_modules/` to `.gitignore`, removed from tracking with `git rm --cached -r` |

---

## 🚦 Frontend Live-Data Architecture

All static/mock data has been removed from the frontend. Every page loads from the live API:

| File | Change Made |
|---|---|
| `frontend/src/api/client.js` | `fallbackData` returns empty arrays / zero numbers |
| `frontend/src/context/AuthContext.jsx` | Removed hardcoded demo admin fallback; real login only |
| `frontend/src/pages/CountingDashboard.jsx` | `DEFAULT_DENOMINATIONS` all set to 0; counts loaded from DB |
| `frontend/src/pages/OnlinePaymentsPage.jsx` | `DEFAULT_ONLINE_DONATIONS` array removed; loads from API |
| `backend/controllers/statsController.js` | No `mockStats`; denomination breakdown from `cash_denominations` table |
| `backend/controllers/causeController.js` | No `mockCauses`; full DB CRUD |
| `backend/controllers/donationController.js` | No `mockDonations`; full DB persistence |

---

## 📬 Hardware Simulation Model

For demonstrations without physical IoT hardware:
1. **Weight Telemetry Simulator:** Computes box weight (~1g per banknote), fires `BOX_FULL` alerts when fill > 85% or weight > 20kg.
2. **Optical Note Validator Simulator:** Generates synthetic note insertion events with serial number snippets and confidence scores.
3. **Tamper Gyro Simulator:** Emulates unauthorized movement, immediately creating `HIGH` severity `system_alerts`.

---

## 📄 Section 80G Statutory Compliance

- Under Indian Income Tax Act Section 80G, donations to registered charitable trusts get 50% tax deduction.
- Requirements handled:
  1. Mandatory PAN collection and validation
  2. Sequential non-duplicable receipt numbering (`SDP-REC-YYYYMMDD-XXXX`)
  3. Dynamic QR code with cryptographic verification URL
  4. Instant PDF-ready printable receipt modal with trust 80G number

---

## 🔄 Data Seeding Instructions (Post-Clear)

After the 2026-11-23 data clear, re-seed the following tables via the admin UI before going live:

1. **`smart_boxes`** — Register physical box devices via Device Settings page
2. **`causes`** — Add Seva funds (Annadanam, Renovation, Goshala, etc.) via Causes page  
3. **`app_settings`** — Set trust name, UPI VPA, 80G number via Settings page
4. **`cash_denominations`** — Auto-populated on first save from Counting Room page

> Run `npm run init-db` to re-seed all tables with baseline data (will skip if `users` table is non-empty — safe to run).

---

*Authored & maintained by Antigravity AI for the Smart Dan Peti Trust & Engineering Team.*
