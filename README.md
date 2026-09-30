# 🔧 ToolTrunk

**ToolTrunk** is a full-stack tool rental and borrowing platform designed to connect tool owners with people who need tools for temporary use.

The project focuses on real-world application architecture, secure authentication, role-based workflows, rental management, and scalable backend infrastructure.

## 🚀 Features

* 🔐 JWT-based authentication
* 👤 Role-based access for Guests, Owners, and Borrowers
* 🛠️ Tool listing and management
* 🔎 Browse and discover available tools
* 📦 Tool rental / borrowing workflow
* 📊 Dashboard for managing platform activity
* 📒 Rental ledger and transaction tracking
* 👤 User profile management
* ☁️ Cloud-ready architecture
* ⚡ Redis caching
* 🐳 Docker containerization
* 🔒 Environment-based configuration
* 📱 Responsive and modern UI

## 🏗️ Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* REST APIs

### Infrastructure & Tools

* Redis
* Docker
* AWS
* Git & GitHub
* Postman

## 📁 Project Structure

```text
tooltrunk/
├── Frontend/
│   ├── app/
│   ├── components/
│   └── ...
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ...
│
└── README.md
```

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/muhammadahmed144/tooltrunk.git
cd tooltrunk
```

### 2. Install dependencies

Frontend:

```bash
cd Frontend
npm install
```

Backend:

```bash
cd Backend
npm install
```

### 3. Configure environment variables

Create `.env` files according to the required configuration.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

### 4. Run the application

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm run dev
```

## 🔐 Authentication

ToolTrunk uses JWT-based authentication to protect private routes and manage authenticated users.

Different user roles provide different capabilities across the platform.

## 🧩 Architecture

The application follows a modern full-stack architecture:

```text
Next.js Frontend
       │
       ▼
REST API
       │
       ▼
Node.js + Express
       │
   ┌───┴────┐
   ▼        ▼
MongoDB   Redis
       │
       ▼
    AWS / Docker
```

## 📌 Project Status

🚧 **Active Development**

ToolTrunk is being developed as a production-focused full-stack project with emphasis on scalable architecture, clean UI, authentication, caching, containerization, and cloud technologies.

## 🎯 Learning & Development Goals

This project is designed to provide practical experience with:

* Full-stack application development
* REST API architecture
* Authentication & authorization
* Database design
* Redis caching
* Docker
* AWS
* Production-oriented project structure
* Modern Next.js development

## 👨‍💻 Author

**Muhammad Ahmed Mohsin**

GitHub: [@muhammadahmed144](https://github.com/muhammadahmed144)

---

⭐ If you find this project useful, consider giving it a star!
