<<<<<<< HEAD
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
=======
# ToolTrunk

**ToolTrunk** is a full-stack tool rental and borrowing platform that allows users to list, discover, rent, and manage tools through a centralized web application.

The platform is designed with a modern full-stack architecture, secure authentication, role-based access, rental management, and scalable backend infrastructure.
>>>>>>> 91c5195e7d57376719984f606945ca33b1318181

---

## Features

<<<<<<< HEAD
1. **Authentication**: Register with Name, Email, Password, and Postal Code; secure JWT session token persistence.
2. **Overview Hub**: Trust score indicator with progress bar to next tier (Bronze -> Silver -> Gold -> Platinum).
3. **Quick Adjuster**: Simulate tool borrowing, return actions, and point changes in real time.
4. **Active Sharing Zone**: Visual radius map of local community sharing partners based on postal code and max distance.
5. **My Shelf**: Add, edit, manage, and delete tools available for neighbor borrowing.
6. **Trust Ledger**: Searchable, filterable audit trail of all historical reputation interactions.
7. **Profile & Location Settings**: Edit display name, postal code, max sharing radius, and change password.
=======
* User authentication and authorization
* Role-based access control
* Tool listing and management
* Browse and search available tools
* Tool rental and borrowing workflow
* Owner and borrower management
* Rental ledger and transaction tracking
* User profile management
* Dashboard for managing platform activity
* RESTful API integration
* Redis caching
* Docker-based development environment

---

## Architecture

ToolTrunk follows a **client-server architecture** with a Next.js frontend communicating with a Node.js/Express REST API.

```text
                         ┌─────────────────────┐
                         │      ToolTrunk      │
                         │     Web Client      │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP / REST API
                                    ▼
                         ┌─────────────────────┐
                         │   Next.js Frontend  │
                         │ React + Tailwind CSS│
                         └──────────┬──────────┘
                                    │
                                    │ API Requests
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js + Express │
                         │      REST API       │
                         └──────┬────────┬─────┘
                                │        │
                    ┌───────────┘        └───────────┐
                    ▼                                ▼
          ┌─────────────────┐              ┌─────────────────┐
          │     MongoDB     │              │      Redis      │
          │   Data Storage  │              │     Caching     │
          └─────────────────┘              └─────────────────┘
```

### Architecture Components

**Frontend**

* Next.js
* React
* Tailwind CSS
* Client-side API communication

**Backend**

* Node.js
* Express.js
* RESTful APIs
* JWT authentication
* Role-based authorization

**Data Layer**

* MongoDB for persistent application data
* Mongoose for database modeling
* Redis for caching

**Infrastructure**

* Docker for containerization
* AWS for cloud infrastructure and deployment

---

## Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* JavaScript
* Axios

### Backend

* Node.js
* Express.js
* REST APIs
* JWT
* bcrypt
* Mongoose

### Database & Caching

* MongoDB
* MongoDB Atlas
* Redis

### DevOps & Infrastructure

* Docker
* AWS
* Git
* GitHub

### Development Tools

* VS Code
* Postman

---

## Project Structure

```text
tooltrunk/
│
├── Frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── ...
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── ...
│
└── README.md
```

---

## Authentication & Authorization

ToolTrunk uses **JWT-based authentication** to secure protected resources and manage authenticated users.

Role-based authorization is used to control access to platform functionality based on the user's role.

```text
User
 │
 ├── Authentication
 │       │
 │       └── JWT
 │
 └── Authorization
         │
         ├── Owner
         │
         └── Borrower
```

---

## API Architecture

The backend exposes RESTful endpoints for handling application resources and business operations.

```text
Client
  │
  ▼
REST API
  │
  ├── Authentication
  ├── Users
  ├── Tools
  ├── Rentals
  ├── Ledger
  └── Dashboard
  │
  ▼
Controllers
  │
  ▼
Models / Services
  │
  ▼
MongoDB / Redis
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Redis
* Git

### Clone Repository

```bash
git clone https://github.com/muhammadahmed144/tooltrunk.git

cd tooltrunk
```

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_connection_string
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

Open a new terminal:

```bash
cd Frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Environment Variables

The backend requires environment variables for configuration and sensitive credentials.

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `PORT`        | Backend server port                |
| `MONGODB_URI` | MongoDB connection string          |
| `JWT_SECRET`  | Secret used for JWT authentication |
| `REDIS_URL`   | Redis connection URL               |

> Never commit `.env` files or expose sensitive credentials in the repository.

---

## Development Workflow

```text
Development
     │
     ▼
Git
     │
     ▼
GitHub
     │
     ▼
Docker
     │
     ▼
AWS Infrastructure
```

The project is structured to support containerized development and cloud-based deployment.

---

## Security

ToolTrunk follows common backend security practices including:

* JWT-based authentication
* Password hashing with bcrypt
* Protected API routes
* Role-based authorization
* Environment-based secret management
* CORS configuration
* Input validation and controlled API access

---

## Project Status

ToolTrunk is an actively developed full-stack application focused on building a practical tool rental and borrowing platform with modern web technologies and scalable backend architecture.

---

## Author

**Muhammad Ahmed Mohsin**

GitHub: **[@muhammadahmed144](https://github.com/muhammadahmed144)**

---

## License

This project is developed for portfolio and educational purposes.
>>>>>>> 91c5195e7d57376719984f606945ca33b1318181
