# Stage 1: Build
FROM node:22-alpine AS builder

# Build arguments for version injection
ARG APP_VERSION=0.0.0
ARG COMMIT_HASH=dev

# Set environment variables for build
ENV APP_VERSION=${APP_VERSION}
ENV COMMIT_HASH=${COMMIT_HASH}

WORKDIR /app

# Install dependencies (layer cached when package*.json unchanged)
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
