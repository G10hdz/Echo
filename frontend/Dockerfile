FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
