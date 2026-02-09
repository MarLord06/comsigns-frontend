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

# Railway asigna el puerto dinámicamente
EXPOSE 3000

# Servir la aplicación - usa shell form para expandir $PORT
CMD serve -s dist -l ${PORT:-3000}

