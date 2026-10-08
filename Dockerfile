# =============================================================
# Stage 1: Build the Vite Frontend
# =============================================================
FROM node:22-alpine AS builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build
COPY client/ ./
RUN npm run build

# =============================================================
# Stage 2: Production Server Runner
# =============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root server package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./server/
COPY .env.example ./.env

# Copy built frontend assets from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Start production server
CMD ["node", "server/server.js"]
