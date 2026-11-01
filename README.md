 # Smart Dan Peti (Smart Donation Box & Trust Management System)

A state-of-the-art, IoT-enabled Smart Donation Box and Financial Governance platform designed for temple trusts, shrines, and charitable organizations. It bridges traditional sanctum offerings with modern digital transparency, optical banknote verification, live telemetry, and automated Section 80G tax receipts.

---

## 🌟 Key Features

1. **Smart Dan Peti Dashboard**
   - Live KPI cards: Total Collections, Today's donations, and transaction volume.
   - Physical cash inside deployed boxes with strain-gauge weight telemetry.
   - Real-time 7-day daily collection progression chart.
   - Physical currency denomination breakdown (₹500, ₹200, ₹100, ₹50, ₹20, ₹10, Coins).
   - Live device connection status fleet and recent transactions ledger.

2. **Banknote Sensor & AI Verification Review (Demo Detection Mode)**
   - Optical spectral & bill validator buffer: view captured banknotes awaiting verification.
   - Sensor confidence score indicators (High match vs Review required).
   - Instant decision controls: **Approve Note**, **Manual Denomination Override**, or **Reject**.
   - Built-in **Demo Detection Simulator** to generate synthetic banknote events for testing without physical hardware.

3. **Donation History & Electronic Ledger**
   - Comprehensive searchable and filterable donation records.
   - Filter by dedicated Seva/Cause and Payment Channel (`UPI_QR`, `CASH_BOX`, `CARD`, `NET_BANKING`).
   - One-click **CSV Export** for statutory audit and compliance.
   - Official **Section 80G Compliant Printable E-Receipt** with cryptographic QR code verification.

4. **IoT Device Fleet & Physical Security**
   - Real-time monitoring of deployed Dan Petis: battery %, capacity fill %, and sensor weight in kg.
   - **Tilt / Tamper Alarm Sensor**: Instant alert logging upon unauthorized lid movement.
   - **Dual-Key Physical Cash Clearance**: Requires two distinct authorized trustees/officials to authenticate and record security tamper-proof seal bag numbers.

5. **Financial Analytics & Transparency**
   - Gross collections, verified seva expenditure, and net trust corpus balance.
   - Payment channel breakdown (Cash vs Digital UPI/Card).
   - Seva corpus targets progress bar (Annadanam, Temple Renovation, Goshala, Vidyadhanam).

6. **Role-Based Access Control (RBAC)**
   - Granular privilege management: `ADMIN`, `TRUSTEE`, `AUDITOR`, `PRIEST`, `OPERATOR`.
   - 1-Click quick demo role switcher for frictionless testing.
   - Add new authorized personnel with role assignments.

7. **Security & Operational Audit Logs**
   - Immutable audit trail recording user logins, dual-key clearances, sensor approvals, and settings changes with IP and timestamps.

8. **Trust Configuration & Thresholds**
   - Configurable Trust name, 80G certificate registration, UPI VPA endpoint, weight alarm thresholds, and Demo Mode toggle.

---

## 🛠️ Technology Stack

- **Frontend**: React.js 19, Vite 8, Lucide React icons, Canvas Confetti, Vanilla CSS (Glassmorphism design system)
- **Backend**: Node.js v26+, Express.js 4, MySQL2 (Connection Pooling & Promises), JWT Authentication, QRCode generator
- **Database**: MySQL 8.0+ / MariaDB (`smart_dan_peti` database)

---

## 🗄️ Database Architecture

The MySQL database schema is located at `database/schema.sql` and includes the following tables:

| Table | Purpose |
| :--- | :--- |
| `users` | Trust officials, trustees, priests, auditors, operators |
| `smart_boxes` | Physical Dan Peti telemetry, cash amount, weight, battery, status |
| `causes` | Charitable trust funds (Annadanam, Renovation, Goshala, etc.) |
| `donations` | Digital and cash donation transaction records |
| `pending_detections` | Optical banknote verification buffer & sensor logs |
| `cash_emptying_logs` | Dual-key authorization audit trail for emptied cash bags |
| `expenses` | Fund utilization and expenditure transparency |
| `sankalps` | Devotee prayers and sanctum priest blessing status |
| `system_alerts` | Tamper, box capacity, and IoT device alerts |
| `audit_logs` | Statutory administrative and security activity logs |
| `app_settings` | Trust name, 80G certificate, UPI VPA, and threshold configs |

---

## 🚀 Quick Start (Single Command)

Run both Frontend and Backend concurrently from the root directory:

```powershell
npm run dev
```

- **Frontend App**: http://localhost:5174
- **Backend API**: http://localhost:5000/api

---

## 🛠️ Individual Services Run Commands (Optional)

Open two Windows PowerShell terminals in `E:\Smart-Dan-Peti`:

### Terminal 1: Backend API Server
```powershell
# Navigate to backend directory
cd E:\Smart-Dan-Peti\backend

# Start the Node.js Express server (runs on port 5000)
npm start
# Alternatively for live reload:
# npm run dev
```

### Terminal 2: Vite React Frontend
```powershell
# Navigate to frontend directory
cd E:\Smart-Dan-Peti\frontend

# Start the Vite development server (runs on http://localhost:5174/)
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:5174/](http://localhost:5174/)**

---

## 🔑 Demo Access Credentials

For quick evaluation, you can use any of the pre-configured accounts:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartdanpeti.org` | `admin123` | Full administrative control & configurations |
| **Trustee** | `trustee@smartdanpeti.org` | `admin123` | Dual-key emptying authorization & governance |
| **Auditor** | `auditor@smartdanpeti.org` | `admin123` | Banknote detection verification & ledger audit |
| **Priest** | `priest@smartdanpeti.org` | `admin123` | Sanctum pooja seva & devotee sankalp blessings |
| **Operator** | `operator@smartdanpeti.org` | `admin123` | Dan Peti kiosk & sensor log monitoring |

*Note: You can also use the **"Quick One-Click Demo Roles"** buttons on the Login page for 1-click sign-in.*

---

## 🧪 Testing Demo Detection Mode

1. In the top navigation bar, click the **"Simulate Bill Sensor"** button (or navigate to **"Pending Review"** tab).
2. Choose a banknote denomination (e.g., ₹500, ₹200, ₹100).
3. Select a target Smart Dan Peti (e.g., *Sanctum Sanctorum Dan Peti*).
4. Set the simulated AI sensor confidence score (e.g., 94%).
5. Click **"Trigger Note Insertion Event"**.
6. The note will instantly appear in the **Pending Review** buffer where you can verify, override denomination, or approve it into the official trust ledger.
