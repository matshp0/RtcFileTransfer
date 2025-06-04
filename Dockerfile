# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY server.js ./
EXPOSE 8000
CMD ["npm", "run", "serve"] 
