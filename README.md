# ToolTrunk - Neighbor-to-Neighbor Tool Sharing Platform

ToolTrunk connects neighbors to share tools, track equipment loans, and build community trust through a verified reputation score system.

---

## Architecture Overview

- **Frontend**: **Next.js 14** (App Router, React 18, Tailwind CSS, Lucide Icons, Framer Motion)
  - Modular Next.js App Router structure under `Frontend/src/app`
  - Client state & authentication managed with Context API (`AuthContext`, `DashboardContext`)
  - Full responsive design with mobile navigation bar, animated trust tiers, and dynamic range maps
  - Reverse proxy via `next.config.mjs` routing `/api/*` to the backend
- **Backend**: **Node.js + Express** (MVC Architecture, ES Modules, Native Crypto HMAC SHA-256 JWT, MongoDB)
  - Modular controllers (`authController.js`, `toolController.js`)
  - Models (`userModel.js`, `toolModel.js`)
  - Authentication middleware (`authMiddleware.js`)
  - Scalable MongoDB cloud database connection with reconnect handling

---

## Getting Started

### 1. Backend Setup & Run

In the `Backend` directory:

```bash
cd Backend
npm install
npm run dev
```

The Express server will start on `http://localhost:5000`.

### 2. Frontend Setup & Run

In the `Frontend` directory:

```bash
cd Frontend
npm install
npm run dev
```

The Next.js application will start on `http://localhost:3000`.

### 3. Production Build

To build the Next.js frontend for production:

```bash
cd Frontend
npm run build
npm start
```

---

## Features

1. **Authentication**: Register with Name, Email, Password, and Postal Code; secure JWT session token persistence.
2. **Overview Hub**: Trust score indicator with progress bar to next tier (Bronze -> Silver -> Gold -> Platinum).
3. **Quick Adjuster**: Simulate tool borrowing, return actions, and point changes in real time.
4. **Active Sharing Zone**: Visual radius map of local community sharing partners based on postal code and max distance.
5. **My Shelf**: Add, edit, manage, and delete tools available for neighbor borrowing.
6. **Trust Ledger**: Searchable, filterable audit trail of all historical reputation interactions.
7. **Profile & Location Settings**: Edit display name, postal code, max sharing radius, and change password.
