# ToolTrunk AWS Production Architecture & Deployment Guide

This guide details the recommended infrastructure patterns for deploying ToolTrunk to Amazon Web Services (AWS) using modern containerized best practices without hardcoding secrets in the repository.

---

## 1. Architecture Overview

```text
       Internet
          │
          ▼
   Route 53 & CloudFront CDN (HTTPS / TLS)
          │
    ┌─────┴───────────────────────┐
    │                             │
    ▼                             ▼
AWS App Runner / ECS (Frontend)  AWS App Runner / ECS (Backend)
Next.js Container (:3000)        Express REST API Container (:5000)
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
           Amazon ElastiCache   MongoDB Atlas   AWS Secrets Manager
           (Redis 7 Cluster)   (Document Store) (IAM Role-managed)
```

---

## 2. Recommended AWS Services

1. **Backend Compute**:
   - **AWS App Runner** or **AWS ECS (Fargate)**
   - Fully managed container execution with auto-scaling based on incoming request concurrency.

2. **Frontend Compute**:
   - **AWS App Runner**, **AWS Amplify**, or **Vercel**
   - Serves the Next.js production build (`npm start`).

3. **In-Memory Cache & Rate Limiting**:
   - **Amazon ElastiCache for Redis** (Cluster or Serverless)
   - Low-latency cache store for tool search queries, details, and IP rate-limiting.

4. **Secrets Management**:
   - **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**
   - Inject environment variables securely into ECS task definitions or App Runner configurations at runtime using IAM execution roles.

---

## 3. Required Environment Variables on AWS

### Backend (App Runner / ECS Task Definition)

| Variable | Description | Source |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Static environment |
| `PORT` | `5000` | Static environment |
| `CLIENT_URL` | Deployed frontend domain (e.g., `https://tooltrunk.yourdomain.com`) | Static environment |
| `JWT_SECRET` | 256-bit cryptographically secure secret key | AWS Secrets Manager |
| `JWT_EXPIRES_IN` | Session duration (e.g., `7d`) | Static environment |
| `REDIS_URL` | Primary endpoint of Amazon ElastiCache (e.g., `rediss://...:6379`) | AWS Secrets Manager / SSM |
| `MONGODB_URI` | MongoDB Atlas VPC connection string | AWS Secrets Manager |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) | AWS Secrets Manager |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) | AWS Secrets Manager |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary tenant identifier | AWS Secrets Manager |
| `CLOUDINARY_API_KEY` | Cloudinary access key | AWS Secrets Manager |
| `CLOUDINARY_API_SECRET`| Cloudinary access secret | AWS Secrets Manager |
| `RESEND_API_KEY` | Resend transactional mail key (`re_...`) | AWS Secrets Manager |
| `EMAIL_FROM` | Verified sender address (e.g., `notifications@tooltrunk.com`) | Static environment |
| `SENTRY_DSN` | Sentry backend DSN | AWS Secrets Manager |

### Frontend (Next.js Deployed Environment)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API (e.g., `https://api.tooltrunk.yourdomain.com/api`) |
| `BACKEND_URL` | Internal VPC endpoint or public URL for server rewrites |

---

## 4. Security Principles

- **No Secrets in Code or Docker**: Dockerfiles contain zero credentials or tokens.
- **IAM Roles over Access Keys**: App Runner and ECS tasks use IAM Execution Roles to fetch secrets from AWS Secrets Manager.
- **VPC Peering / Security Groups**: Restrict ElastiCache Redis ingress strictly to the backend security group on port 6379.
