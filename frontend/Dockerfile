FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Production build target
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npx", "vite", "preview"]