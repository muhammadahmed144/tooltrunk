# ToolTrunk Backend Production Dockerfile
FROM node:20-alpine AS base

# Install build dependencies for native modules (like sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
