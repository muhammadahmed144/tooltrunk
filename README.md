# ToolTrunk

**ToolTrunk** is a full-stack tool rental and borrowing platform that allows users to list, discover, rent, and manage tools through a centralized web application.

The platform is designed with a modern full-stack architecture, secure authentication, role-based access, rental management, and scalable backend infrastructure.

---

## Features

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
