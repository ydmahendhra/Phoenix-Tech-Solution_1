# Phoenix Tech Solutions - Docker Containerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start production server
CMD ["node", "server.js"]
