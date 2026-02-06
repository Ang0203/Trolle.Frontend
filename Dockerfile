# =========================
# Base image
# =========================
FROM node:20-alpine AS base

# =========================
# Dependencies stage
# =========================
FROM base AS deps
WORKDIR /app

# Required for some native Node deps on Alpine
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# =========================
# Build stage
# =========================
FROM base AS builder
WORKDIR /app

# Reuse installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source and build
COPY . .

# next.config.mjs is expected to use output: 'standalone'
RUN npm run build

# =========================
# Runtime stage
# =========================
FROM base AS runner
WORKDIR /app
EXPOSE 2208

# Runtime environment
ENV NODE_ENV=production
ENV PORT=2208
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy runtime artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drop privileges
USER nextjs

# Start server
CMD ["node", "server.js"]