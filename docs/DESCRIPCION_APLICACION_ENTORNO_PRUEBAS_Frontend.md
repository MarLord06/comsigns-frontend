# Descripción de la Aplicación y Entorno de Pruebas

## Informe de Calidad de Software - COMSIGNS Web Frontend

**Fecha:** Febrero 2026  
**Versión del Proyecto:** 0.1.0  
**Autor:** Equipo QA

---

## 1. Nombre y Objetivo del Proyecto

### Nombre
**COMSIGNS Web** - Sistema de Traducción de Lengua de Señas Chilena

### Objetivo
COMSIGNS Web es una aplicación de traducción de Lengua de Señas Chilena (LSCh) a texto mediante inteligencia artificial. Su propósito principal es **facilitar la comunicación para personas con discapacidad auditiva**, permitiendo capturar señas a través de video o cámara web y obtener su traducción textual en tiempo real.

La aplicación actúa como interfaz visual del sistema COMSIGNS, conectándose a un backend de inferencia multimodal que procesa los gestos capturados y devuelve predicciones textuales con niveles de confianza asociados.

### Alcance Funcional
- Traducción de videos pregrabados de señas a texto
- Captura y traducción en tiempo real desde cámara web
- Procesamiento batch de múltiples archivos
- Sistema experto para evaluación y validación de predicciones

---

## 2. Arquitectura Tecnológica

### 2.1 Frontend (Objeto Principal de las Pruebas)

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Framework UI** | React | 18.2.0 |
| **Bundler/Dev Server** | Vite | 4.4.0 |
| **Cliente HTTP** | Axios | 1.5.0 |
| **Lenguaje** | JavaScript (ES Modules) | ES2020+ |
| **Estilos** | CSS puro (módulos por componente) | — |
| **Testing E2E** | Cypress | 13.17.0 |
| **Test Runner** | start-server-and-test | 2.0.3 |

### 2.2 Backend (Servicio Externo)

| Componente | Tecnología |
|------------|------------|
| **Framework API** | FastAPI (Python 3.10+) |
| **Modelo ML** | PyTorch / TensorFlow |
| **Plataforma de Despliegue** | Railway |
| **URL de Producción** | `https://comsigns-multimodal-production.up.railway.app` |

### 2.3 Protocolos de Comunicación

| Protocolo | Uso | Endpoint |
|-----------|-----|----------|
| **REST API** | Inferencia de videos y archivos .pkl | `/api/video/infer`, `/infer` |
| **WebSocket** | Captura en tiempo real desde cámara | `/ws/infer` |
| **Formato de Request** | FormData/multipart para uploads | — |
| **Formato de Response** | JSON estructurado | — |

### 2.4 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    COMSIGNS Web Frontend                   │  │
│  │                     React 18 + Vite 4                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │VideoTranslator│ │SampleUploader│ │   CameraCapture    │  │  │
│  │  │  (.mp4/.avi) │ │   (.pkl)    │ │   (WebSocket)      │  │  │
│  │  └──────┬──────┘ └──────┬──────┘ └─────────┬───────────┘  │  │
│  │         │               │                   │              │  │
│  │         └───────────────┼───────────────────┘              │  │
│  │                         │                                  │  │
│  │              ┌──────────▼──────────┐                       │  │
│  │              │   API Layer (Axios)  │                       │  │
│  │              │   config.js / videoApi.js                   │  │
│  │              └──────────┬──────────┘                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    HTTP/HTTPS + WebSocket
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Railway Cloud)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              FastAPI + PyTorch/TensorFlow                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │ Video Infer  │  │  PKL Infer   │  │ WebSocket Handler│  │  │
│  │  │   /api/video │  │   /infer     │  │   /ws/infer      │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │  │
│  │                         │                                  │  │
│  │              ┌──────────▼──────────┐                       │  │
│  │              │   ML Inference Engine │                      │  │
│  │              │   (Sign Language Model)│                     │  │
│  │              └─────────────────────┘                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Funcionalidades Principales

La aplicación cuenta con **4 modos de operación** principales, cada uno representado por un componente React específico:

### 3.1 Matriz de Funcionalidades

| Nº | Modo | Funcionalidad | Componente | Endpoint Backend |
|----|------|---------------|------------|------------------|
| 1 | **Traducir Video** | Subir uno o múltiples archivos de video para traducción | `VideoTranslator.jsx` | `POST /api/video/infer` |
| 2 | **Inferir Sample** | Subir archivo .pkl con features pre-extraídos | `SampleUploader.jsx` | `POST /infer?topk=N` |
| 3 | **Sistema Experto** | Procesamiento batch de múltiples .pkl con evaluación | `ExpertPanel.jsx` | `POST /infer/batch/evaluate` |
| 4 | **Cámara en Vivo** | Captura en tiempo real desde webcam | `CameraCapture.jsx` | `WS /ws/infer` |

### 3.2 Detalle de Funcionalidades por Modo

#### 3.2.1 Modo: Traducir Video
- Selección de archivos de video (.mp4, .avi, .mov, .mkv)
- Soporte para upload múltiple (batch)
- Visualización de lista de archivos seleccionados
- Eliminación individual de archivos de la lista
- Botón "Limpiar todo" para resetear selección
- Indicador de progreso durante procesamiento
- Visualización de resultados con gloss, confianza y estado

#### 3.2.2 Modo: Inferir Sample
- Selección de archivo .pkl (features pre-extraídos)
- Selector de Top-K (3, 5, 10 predicciones)
- Estado de carga con spinner animado
- Resultado principal destacado (Top-1)
- Lista de predicciones alternativas (Top-K)
- Indicador de bucket (HEAD, MID, OTHER)

#### 3.2.3 Modo: Sistema Experto
- Drop zone para múltiples archivos .pkl
- Lista de archivos con posibilidad de eliminar
- Procesamiento batch con summary estadístico
- Decisión automática de aceptación/rechazo
- Visualización de razón de cada decisión
- Secuencia de palabras reconocidas

#### 3.2.4 Modo: Cámara en Vivo
- Activación de cámara web del dispositivo
- Captura de frames a 10 FPS
- Comunicación bidireccional vía WebSocket
- Predicción instantánea por frame
- Indicadores de estado de conexión
- Reconexión automática ante desconexión

### 3.3 Funcionalidades Transversales

| Funcionalidad | Descripción |
|---------------|-------------|
| **Navegación por modos** | Botones de modo con estado activo/inactivo |
| **Validación de archivos** | Rechazo de formatos no soportados |
| **Estados de loading** | Spinners, botones deshabilitados durante operaciones |
| **Manejo de errores** | Toasts de error con mensaje descriptivo |
| **Responsive Design** | Adaptación básica a diferentes tamaños de pantalla |

---

## 4. Entorno de Pruebas

### 4.1 Configuración del Sistema

| Aspecto | Especificación |
|---------|----------------|
| **Sistema Operativo** | macOS Sonoma / Ventura |
| **Tipo de Entorno** | Desarrollo local con backend en producción |
| **Servidor Frontend** | Vite Dev Server |
| **Puerto Local** | `http://localhost:3000` |
| **Backend de Pruebas** | `https://comsigns-multimodal-production.up.railway.app` |

### 4.2 Framework de Testing: Cypress 13.17.0

#### Configuración Principal (`cypress.config.js`)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | URL base para todas las visitas |
| `viewportWidth` | 1280 px | Ancho de ventana de pruebas |
| `viewportHeight` | 720 px | Alto de ventana de pruebas |
| `defaultCommandTimeout` | 10,000 ms | Timeout para comandos DOM |
| `requestTimeout` | 60,000 ms | Timeout para peticiones HTTP |
| `responseTimeout` | 60,000 ms | Timeout para respuestas |
| `video` | `true` | Grabación de video habilitada |
| `screenshotOnRunFailure` | `true` | Captura de pantalla en fallos |
| `retries.runMode` | 2 | Reintentos en modo CI |
| `retries.openMode` | 0 | Sin reintentos en modo interactivo |

### 4.3 Navegadores Soportados

| Navegador | Versión Mínima | Uso en Testing |
|-----------|----------------|----------------|
| **Google Chrome** | 100+ | Principal (Cypress default) |
| **Mozilla Firefox** | 100+ | Compatibilidad secundaria |
| **Microsoft Edge** | 100+ (Chromium) | Compatibilidad terciaria |

> **Nota:** Las pruebas E2E se ejecutan principalmente en Chrome a través de Cypress, aprovechando el soporte nativo de Chromium en el framework.

### 4.4 Requisitos de Hardware/Software

| Requisito | Especificación |
|-----------|----------------|
| **Node.js** | v16.0.0 o superior |
| **npm** | v8.0.0 o superior |
| **RAM** | Mínimo 4 GB (recomendado 8 GB) |
| **Conexión a Internet** | Requerida (backend en Railway) |
| **Cámara Web** | Opcional (solo para modo Cámara en Vivo) |

### 4.5 Estructura del Proyecto de Tests

```
cypress/
├── e2e/                              # Tests E2E organizados por flujo
│   ├── 01-initial-load.cy.js         # Carga inicial de la aplicación
│   ├── 02-mode-switching.cy.js       # Navegación entre modos
│   ├── 03-upload-single-video.cy.js  # Upload de video único
│   ├── 04-upload-multiple-videos.cy.js # Upload de múltiples videos
│   ├── 05-upload-pkl-sample.cy.js    # Inferencia de samples .pkl
│   ├── 06-expert-panel-batch.cy.js   # Sistema Experto batch
│   ├── 07-file-validation.cy.js      # Validación de formatos
│   ├── 08-loading-state.cy.js        # Estados de carga
│   ├── 09-results-rendering.cy.js    # Renderizado de resultados
│   └── 10-error-handling.cy.js       # Manejo de errores
├── fixtures/                          # Archivos de prueba
│   ├── sample-video.mp4              # Video de prueba 1
│   ├── sample-video-2.mp4            # Video de prueba 2
│   ├── sample-video-3.mp4            # Video de prueba 3
│   ├── sample-features.pkl           # Features de prueba 1
│   ├── sample-features-2.pkl         # Features de prueba 2
│   ├── sample-features-3.pkl         # Features de prueba 3
│   ├── invalid-file.txt              # Archivo inválido para validación
│   └── invalid-image.jpg             # Imagen inválida para validación
└── support/                           # Archivos de soporte
    ├── commands.js                    # Comandos personalizados
    └── e2e.js                         # Configuración global de tests
```

### 4.6 Comandos de Ejecución

| Comando | Descripción |
|---------|-------------|
| `npm run cy:open` | Abre Cypress en modo interactivo (GUI) |
| `npm run cy:run` | Ejecuta tests en modo headless (CI) |
| `npm run cy:run:headed` | Ejecuta tests con navegador visible |
| `npm run test:e2e` | Inicia servidor + ejecuta tests headless |
| `npm run test:e2e:open` | Inicia servidor + abre Cypress GUI |

### 4.7 Variables de Entorno

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `VITE_API_URL` | `https://comsigns-multimodal-production.up.railway.app` | URL del backend |
| `PORT` | `3000` | Puerto del servidor de desarrollo |

---

## 5. Consideraciones Adicionales

### 5.1 Limitaciones Conocidas

1. **Dependencia de Backend Externo**: Las pruebas E2E dependen de la disponibilidad del backend en Railway
2. **Archivos de Fixtures**: Los videos y .pkl de prueba deben ser archivos válidos procesables por el backend
3. **Permisos de Cámara**: El modo Cámara en Vivo requiere permisos del navegador que no pueden automatizarse completamente

### 5.2 Estrategia de Testing

- **Sin Mocks**: Los tests se ejecutan contra el backend real para validar integración completa
- **Timeouts Extendidos**: 120 segundos para operaciones de inferencia que pueden ser lentas
- **Reintentos Automáticos**: 2 reintentos en modo CI para manejar inestabilidad de red

### 5.3 Cobertura de Tests

| Suite | Nº de Tests | Flujos Cubiertos |
|-------|-------------|------------------|
| 01-initial-load | 5 | Carga inicial, elementos visibles |
| 02-mode-switching | 6 | Navegación, estados activos |
| 03-upload-single-video | 7 | Upload, procesamiento, resultados |
| 04-upload-multiple-videos | 6 | Batch upload, lista, eliminación |
| 05-upload-pkl-sample | 8 | Inferencia .pkl, Top-K |
| 06-expert-panel-batch | 8 | Batch .pkl, decisiones |
| 07-file-validation | 6 | Rechazo de formatos inválidos |
| 08-loading-state | 8 | Spinners, botones disabled |
| 09-results-rendering | 8 | Gloss, confianza, barras |
| 10-error-handling | 10 | Errores 500, network, recovery |
| **TOTAL** | **~70** | **10 flujos principales** |

---

*Documento generado para el Informe Final de Calidad de Software*  
*Proyecto: COMSIGNS Web Frontend v0.1.0*
