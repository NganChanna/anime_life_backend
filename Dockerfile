# ── Stage 1: Build ──
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema, config & generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source & compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production deps + tsx (needed by prisma.config.ts at runtime)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm i tsx

# Copy Prisma schema, config & re-generate client (prod-only node_modules)
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 8080

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]