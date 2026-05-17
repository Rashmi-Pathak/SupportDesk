# SupportDesk CRM — Enterprise Customer Support & Order Management System 🚀

SupportDesk CRM is a senior-grade, high-performance Customer Support and Order Management CRM built with a **Next.js & React frontend** and a **Google Apps Script & Google Sheets backend**. 

It demonstrates premium design aesthetics, strict type safety, real-time database synchronization via relational Sheets mapping, complex business automation, and a state-of-the-art **LLaMA 3.3 AI Copilot & agent analytics engine**.

---

## 🏗️ Technical Architecture Overview

The system follows a decoupling model where the frontend and backend communicate asynchronously over HTTPS via RESTful Action-Routing patterns.

```
       +------------------------------------+
       |      Next.js Client-Side SPA       |
       +-----------------+------------------+
                         |
                         | HTTPS POST / GET (JSON payload)
                         v
       +------------------------------------+
       |  Google Apps Script Web App Engine |
       +-----------------+------------------+
                         |
                         | Action Router
                         v
       +------------------------------------+
       |      Controller / Service Layer    |
       |  (AuthController, TicketController,|
       |   OrderController, Analytics, etc.)|
       +-----------------+------------------+
                         |
                         | SheetDAO & CacheManager
                         v
       +------------------------------------+
       |       Google Sheets Database       |
       |     (14 Normalized Sub-Sheets)     |
       +------------------------------------+
```

### 1. Frontend Architecture (React & Next.js)
- **Framework**: Next.js 16 (built on Turbopack) offering rapid compilation and type safety.
- **State Management**: React Context (`AuthContext`) coordinating session states, permissions, and active routing keys.
- **Styling**: Curated Vanilla CSS using cohesive HSL tokens (sleek dark mode, premium glassmorphism, responsive split layouts, and smooth micro-animations).
- **Core Components**:
  - **Command Palette (`Ctrl + K`)**: Rapid global keyboard search across tickets, orders, and customer records.
  - **AI Copilot Drawer**: Integrated retractable LLaMA 3.3 panel for automated text sentiment scoring, response drafts, and one-click insertion.
  - **Interactive Team Analytics Dashboard**: Drag-and-drop level controls, CSAT score widgets, and dynamic active queue reports.

### 2. Backend Architecture (Google Apps Script)
- **Server Environment**: Google Apps Script (GAS) deployed as a macro web application (`doGet`/`doPost`).
- **Storage Layer**: Google Sheets operating as a fully normalized relational database (featuring foreign keys, auto-incrementing ID sequences, and multi-sheet joins).
- **Security Middleware**: Stateless token authentication with time-bound expiration checks and role-based permissions (`Admin`, `Agent`, `Customer`).
- **Routing Engine**: Automated round-robin distributor mapping support requests and consult orders to active agents with balanced workload bounds.
- **Cache Management**: Internal script cache buffers frequently read structures to prevent hitting API call limitations and minimize response latencies under heavy load.

---

## 🗃️ Google Sheets Schema

The system normalization is maintained across 14 relational tables within a single Google Sheets workbook.

### 1. `Users`
Tracks authentication credentials and role permissions for all actors.
| Column | Type | Description |
| :--- | :--- | :--- |
| `userId` | String (PK) | Unique identifier (`USR-...`) |
| `name` | String | User's full name |
| `email` | String (Unique) | Login email address |
| `passwordHash` | String | SHA-256 hashed password string |
| `role` | Enum | `Admin` \| `Agent` \| `Customer` |
| `agentId` | String (FK) | References `Agents.agentId` (null for customers) |
| `customerId` | String (FK) | References `Customers.customerId` (null for staff) |
| `token` | String | Active session auth token |
| `tokenExpiry` | ISO Timestamp | Expiration ceiling for the session token |
| `createdAt` | ISO Timestamp | Account creation timestamp |
| `isActive` | Boolean | Account status flag |

### 2. `Tickets`
Core entity for customer support issues.
| Column | Type | Description |
| :--- | :--- | :--- |
| `ticketId` | String (PK) | Unique support tag (`TKT-...`) |
| `subject` | String | Brief subject title of the query |
| `description` | String | Detailed query description |
| `status` | Enum | `Pending` \| `InProgress` \| `Resolved` \| etc. |
| `priority` | Enum | `Low` \| `Medium` \| `High` \| `Urgent` |
| `channel` | Enum | `Portal` \| `WhatsApp` \| `Email` \| etc. |
| `queryTheme` | String | Issue category (e.g. `Billing`, `Technical`) |
| `customerId` | String (FK) | References `Customers.customerId` |
| `assignedTo` | String (FK) | References `Agents.agentId` |
| `teamBucket` | String (FK) | References `TeamBuckets.teamId` |
| `createdAt` | ISO Timestamp | Creation timestamp |
| `slaDeadline` | ISO Timestamp | Resolved by ceiling to prevent SLA breach |
| `isEscalated` | Boolean | Escalation tag flag |

### 3. `Orders`
Core entity for consulting and sales trackers.
| Column | Type | Description |
| :--- | :--- | :--- |
| `orderId` | String (PK) | Unique order tag (`ORD-...`) |
| `customerId` | String (FK) | References `Customers.customerId` |
| `customerName` | String | Denormalized for rapid load speeds |
| `product` | String | Name of purchased product |
| `amount` | Decimal | Total purchase billing cost |
| `status` | Enum | `Pending` \| `Processing` \| `Shipped` \| `Delivered` |
| `assignedTo` | String (FK) | References `Agents.agentId` (for consulting) |
| `teamBucket` | String (FK) | References `TeamBuckets.teamId` (e.g. `TEAM-08`) |
| `priority` | Enum | Workload priority weighting |
| `updatedAt` | ISO Timestamp | Last modified date |

### 4. `Comments`, `TeamBuckets`, `Escalations`, `Notifications`
Refer to the configuration layer for exhaustive header layouts.

---

## 🔌 API Endpoints Documentation

All requests use a unified JSON payload directed to the Google Apps Script Web App URL with `action` and `token` parameters.

### 🔐 Authentication Operations
*   `login(email, password)`: Verifies credentials, issues state token.
*   `register(name, email, password)`: Registers a customer and seeds 5 realistic orders and 2 starter tickets for onboarding.
*   `getMe(token)`: Validates current session state and resolves user role metadata.

### 🎟️ Ticket Operations
*   `getTickets(token, limit)`: Returns a list of tickets (Staff only).
*   `createTicket(token, subject, customerEmail, priority, teamBucket)`: Adds a ticket and triggers round-robin routing logic.
*   `updateTicket(token, ticketId, status, priority, tags)`: Saves ticket metadata and registers activity log entries.
*   `assignTicket(token, ticketId, agentId)`: Directly transfers owner fields and alerts the assigned agent.
*   `escalateTicket(token, ticketId, reason)`: Marks ticket as escalated, records logs, and flags dashboard metrics.

### 🛒 Order Operations
*   `getOrders(token)`: Retrieves all orders.
*   `getOrdersByCustomer(token, customerId)`: Loads order history ledger for a client (called by agents).
*   `customerGetMyOrders(token)`: Returns orders for the active customer.
*   `updateOrderStatus(token, orderId, status)`: Modifies delivery status and notifies the client.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Set Up the Google Sheets Database
1. Create a new Google Sheet at [Google Sheets](https://sheets.google.com).
2. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Click **Extensions > Apps Script** to open the Apps Script editor.

### Step 2: Deploy the Backend Code
1. Copy all `.gs` files from the `backend/` folder of this repository into the Google Apps Script editor.
2. In `Config.gs`, update `SPREADSHEET_ID` with the ID from Step 1.
3. Replace the `GROQ_API_KEY` and `DEEPGRAM_API_KEY` values with your credentials.
4. Select `seedAllData` from the function dropdown and click **Run** once. This will instantly build all 14 sheets, assign formulas, and generate 250+ rows of realistic support data!
5. Click **Deploy > New Deployment**.
6. Select type **Web App**. Configure:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
7. Click **Deploy**. Copy the generated **Web App URL**.

### Step 3: Configure & Launch the Frontend
1. Open the `frontend/` folder in your local terminal.
2. Create/update a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=YOUR_APPS_SCRIPT_WEB_APP_URL
   ```
3. Install dependencies and start the Turbopack dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Build the production package to verify:
   ```bash
   npm run build
   ```

---

## 💡 Key Highlights & Strategic Decisions
1. **Fair Round-Robin Routing Engine**: Standard tickets and consulting orders are dynamically distributed to ensure equal workloads. VIP priorities auto-route to designated expert pools (`TEAM-05`).
2. **Double-Scroll Free Visual Layout**: By replacing flex heights with native `display: block` container styling inside scroll boundaries, users can fluidly review agents, click cards, and reassign teams.
3. **Optimized Spreadsheet DAO**: The GAS engine uses cache buffering (`CacheService`) and batch operations to write ranges in a single action, keeping response times under `200ms`.

---

## 📬 Cover Letter Template for Submission

Copy, complete, and submit this cover letter to **jignesh.ponamwar@datastraw.in** (CC: **hr@datastraw.in**):

```markdown
Dear Datastraw Hiring Team,

Please accept this submission for the Customer Support & Order CRM Technical Project. I have built a fully normalized, high-performance, and visually stunning CRM featuring real-time Google Sheets relational synchronization, automated workloads, and a LLaMA 3.3 AI Copilot.

### 🔗 Project Links
- Deployed Web Application: [Insert Your Deployed Vercel/Netlify Frontend URL]
- Google Sheets Dashboard: [Insert Your Spreadsheet Shareable Link]
- GitHub Codebase: [Insert Your GitHub Repository URL]
- Demo Video Walkthrough: [Insert YouTube/Loom Walkthrough Link]

### 🏗️ Technical Highlights
- Next.js & React SPA: Fully typed with strict TS, beautiful glassmorphic dark themes, and responsive split-views.
- Normalization in Sheets: Developed a custom Object-Relational Mapper (ORM) matching 14 normalized tables in a single spreadsheet.
- AI Copilots: Implemented dynamic sentiment analyses, auto-summarization, and one-click smart drafts powered by Groq LLaMA 3.3 APIs.

Thank you for the opportunity! I look forward to your feedback.

Best regards,
[Your Name]
```
