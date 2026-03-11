# Use the official Node.js image as the base
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build ORM database model assets
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the app
COPY . .

# Build the Next.js app (dummy DATABASE_URL for Prisma schema validation)
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Alpine compatibility for native modules
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Image metadata
LABEL org.opencontainers.image.source="https://github.com/ryantate314/choreboard-nextjs"
LABEL org.opencontainers.image.description="TaterBase home management dashboard"

# Copy built app from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Install prisma CLI for migrations (pin to same version as project)
ARG PRISMA_VERSION=6.9.0
RUN npm install prisma@${PRISMA_VERSION} --save-prod --ignore-scripts

# Create non-root user and set up directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /data/uploads && \
    chown nextjs:nodejs /data/uploads && \
    chown -R nextjs:nodejs /app/node_modules

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
