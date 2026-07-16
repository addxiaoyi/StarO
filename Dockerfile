# ===========================================
# StarX-Oauth Dockerfile
# Multi-stage build for optimized image size
# ===========================================

# Base stage - Node.js runtime
FROM node:20-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    tini

WORKDIR /app

# ===========================================
# Dependencies stage - Install npm packages
# ===========================================
FROM base AS deps

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ===========================================
# Development stage - Full dependencies
# ===========================================
FROM base AS builder

WORKDIR /app

# Copy production dependencies first
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment for build
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# ===========================================
# Production stage - Minimal runtime
# ===========================================
FROM base AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV TINI_ACTION=exec

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for scripts access
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Create .next cache directory
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Use tini for proper signal handling
USER nextjs
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]
