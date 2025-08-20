# ========================================
# Multi-stage build for Job AutoFill Backend
# ========================================

# Stage 1: Build Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install dependencies
RUN cd backend && npm ci --only=production && npm cache clean --force

# Stage 2: Build Application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN cd backend && npm ci

# Copy source code
COPY backend/ ./backend/

# Build the application
RUN cd backend && npm run build

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S jobautofill -u 1001

WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=jobautofill:nodejs /app/backend/node_modules ./backend/node_modules

# Copy built application from builder stage
COPY --from=builder --chown=jobautofill:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=jobautofill:nodejs /app/backend/package*.json ./backend/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER jobautofill

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', (err) => { process.exit(1) })"

# Set working directory to backend
WORKDIR /app/backend

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
