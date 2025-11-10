FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Build stage
FROM base AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build application
RUN pnpm build

# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install ALL dependencies first (including Prisma CLI)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm prisma:generate

# Remove dev dependencies after generating Prisma Client
RUN pnpm prune --prod

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main"]

