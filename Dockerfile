# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Build de producción
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Instalar serve para servir archivos estáticos
RUN npm install -g serve

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist

# Railway usa la variable PORT
ENV PORT=3000
EXPOSE 3000

# Servir la aplicación
CMD ["serve", "-s", "dist", "-l", "3000"]

