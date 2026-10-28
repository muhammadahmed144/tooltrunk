# ToolTrunk Frontend Production Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY . .

# Build Next.js application
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Expose Next.js port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start Next.js production server
CMD ["npm", "start"]
