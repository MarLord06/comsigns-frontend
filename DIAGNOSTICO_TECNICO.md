# 🔬 DIAGNÓSTICO TÉCNICO - COMSIGNS FRONTEND

## 2. FRONTEND

### 2.1 Framework y Tecnología

| Aspecto | Detalle |
|---------|---------|
| **Framework** | React 18.2.0 |
| **Bundler** | Vite 4.4.0 |
| **Lenguaje** | JavaScript (JSX) - Sin TypeScript |
| **HTTP Client** | `fetch` API nativa (Axios instalado pero no usado) |
| **Tipo de Aplicación** | SPA (Single Page Application) |
| **Estado Global** | Ninguno (solo `useState` local) |
| **Routing** | No hay router - navegación por estado `mode` |

### 2.2 Arquitectura de la Aplicación

```
src/
├── App.jsx                    # Componente raíz - Gestiona modos y estado global
├── api/
│   ├── config.js              # Configuración centralizada (URLs, endpoints, constraints)
│   └── videoApi.js            # Cliente API para inferencia de video
└── components/
    ├── CameraCapture.jsx      # Captura WebSocket en tiempo real
    ├── ExpertPanel.jsx        # Panel experto con batch processing
    ├── VideoUploader.jsx      # Upload de video simple
    ├── VideoTranslator.jsx    # Multi-video upload + inference
    ├── SampleUploader.jsx     # Upload de archivos .pkl
    ├── PredictionResult.jsx   # Display de resultados top-k
    ├── VideoPredictionResults.jsx  # Resultados múltiples videos
    ├── InferenceResult.jsx    # Resultados de embeddings
    └── RealtimeResult.jsx     # Resultados en tiempo real
```

**Patrón arquitectónico**: Componentes funcionales con hooks. Sin separación de lógica de negocio - todo está acoplado en los componentes.

### 2.3 Modos de la Aplicación (Vistas Principales)

| Modo | Componente Principal | Funcionalidad |
|------|---------------------|---------------|
| `video` | `VideoTranslator` | Traducción de múltiples videos de señas |
| `expert` | `ExpertPanel` | Sistema experto con evaluación de predicciones |
| `sample` | `SampleUploader` | Inferencia de archivos .pkl individuales |
| `camera` | `CameraCapture` | Inferencia en tiempo real vía WebSocket |

### 2.4 Endpoints Consumidos del Backend

| Endpoint | Método | Componente | Propósito |
|----------|--------|------------|-----------|
| `/infer/video` | POST | `App.jsx` | Inferencia de video individual |
| `/infer` | POST | `App.jsx` | Inferencia de sample .pkl |
| `/infer/evaluate` | POST | `ExpertPanel` | Evaluación experta single file |
| `/infer/batch/evaluate` | POST | `ExpertPanel` | Evaluación experta batch |
| `/api/video/infer` | POST | `videoApi.js` | Inferencia multi-video |
| `/api/video/info` | POST | `videoApi.js` | Metadata de videos |
| `/api/video/config` | GET | `videoApi.js` | Configuración del procesador |
| `/sequence` | GET | `ExpertPanel` | Obtener secuencia acumulada |
| `/sequence/reset` | POST | `ExpertPanel` | Resetear secuencia |
| `/health` | GET | `videoApi.js` | Health check |
| `/ws/infer` | WebSocket | `CameraCapture` | Inferencia en tiempo real |

### 2.5 Manejo de Estado

```jsx
// App.jsx - Estado principal
const [mode, setMode] = useState('video')           // Modo activo
const [result, setResult] = useState(null)          // Resultado video simple
const [predictionResult, setPredictionResult] = useState(null)  // Resultado .pkl
const [realtimePrediction, setRealtimePrediction] = useState(null)  // WebSocket
const [videoResults, setVideoResults] = useState(null)  // Multi-video
const [loading, setLoading] = useState(false)       // Estado de carga
const [error, setError] = useState(null)            // Errores
```

**Observación**: No hay estado global compartido. Cada vista resetea sus propios estados.

### 2.6 Flujo de Autenticación

⚠️ **NO HAY AUTENTICACIÓN IMPLEMENTADA**

- Sin login/logout
- Sin JWT/tokens
- Sin protección de rutas
- API pública sin autorización

### 2.7 Formularios y Validaciones

| Componente | Validaciones |
|------------|--------------|
| `VideoUploader` | MIME type `video/*` |
| `VideoTranslator` | Extensión, MIME type, tamaño máximo (100MB) |
| `SampleUploader` | Extensión `.pkl` |
| `ExpertPanel` | Extensión `.pkl` (múltiples archivos) |

**Validaciones en `src/api/videoApi.js`**:
```javascript
// Tipos permitidos
ALLOWED_MIME_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
ALLOWED_EXTENSIONS: ['.mp4', '.mov', '.avi', '.webm', '.mkv']
MAX_SIZE_MB: 100
```

### 2.8 Comunicación con Backend

**Patrón de comunicación**:
```javascript
// Fetch directo con FormData
const formData = new FormData()
formData.append('file', file)

const response = await fetch(`${API_URL}/infer`, {
  method: 'POST',
  body: formData,
})

if (!response.ok) {
  const errorData = await response.json()
  throw new Error(errorData.detail || 'Error en la inferencia')
}
```

**WebSocket** (`CameraCapture.jsx`):
```javascript
const ws = new WebSocket(`${WS_BASE_URL}/ws/infer`)
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'prediction') {
    onPrediction(message.data)
  }
}
```

### 2.9 Manejo de Errores en UI

| Estado | Visualización |
|--------|---------------|
| Loading | Spinner + mensaje "Procesando..." |
| Error | Toast rojo con mensaje + botón cerrar |
| Success | Componente de resultado específico |

```jsx
{error && (
  <div className="error-toast">
    <span className="error-icon">⚠️</span>
    <span>{error}</span>
    <button onClick={() => setError(null)} className="close-btn">✕</button>
  </div>
)}
```

---

## 3. INTEGRACIÓN BACKEND-FRONTEND

### 3.1 Comunicación HTTP

| Aspecto | Implementación |
|---------|----------------|
| **Cliente HTTP** | `fetch` nativo |
| **Formato request** | `multipart/form-data` (archivos) |
| **Formato response** | JSON |
| **URL Base** | Variable de entorno `VITE_API_URL` |

### 3.2 Configuración Centralizada

**`src/api/config.js`**:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://comsigns-multimodal-production.up.railway.app';

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const API_ENDPOINTS = {
  VIDEO_INFER: '/api/video/infer',
  PKL_INFER: '/infer',
  HEALTH: '/health',
  // ...
};
```

### 3.3 Manejo de Errores de API

```javascript
// Patrón consistente en todos los componentes
try {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Error genérico')
  }
  
  const data = await response.json()
  setResult(data)
} catch (err) {
  setError(err.message || 'Error de conexión')
} finally {
  setLoading(false)
}
```

### 3.4 Estados de Carga

| Estado | Variable | UI Feedback |
|--------|----------|-------------|
| Idle | `loading=false, error=null` | Formulario activo |
| Loading | `loading=true` | Spinner, botones disabled |
| Success | `result !== null` | Componente de resultados |
| Error | `error !== null` | Toast de error |

---

## 4. ENFOQUE EN TESTING

### 4.1 Tipos de Pruebas Viables

| Tipo | Viabilidad | Justificación |
|------|------------|---------------|
| **Unit Tests** | Media | Sin lógica compleja separada de componentes |
| **Integration Tests** | Alta | Comunicación API clara y predecible |
| **E2E Tests** | Alta | Flujos de usuario bien definidos |
| **API Tests** | Alta | Endpoints REST documentados |
| **WebSocket Tests** | Media | Requiere mock de conexión WS |

### 4.2 Endpoints Prioritarios para Postman

1. `POST /infer` - Inferencia básica de sample
2. `POST /infer/evaluate` - Evaluación experta
3. `POST /infer/batch/evaluate` - Batch processing
4. `POST /api/video/infer` - Inferencia de video
5. `GET /health` - Health check
6. `GET /sequence` - Estado de secuencia
7. `POST /sequence/reset` - Reset de secuencia
8. `POST /api/video/info` - Metadata de video
9. `GET /api/video/config` - Configuración
10. `POST /infer/video` - Video single inference

### 4.3 Flujos E2E Prioritarios para Cypress

| # | Flujo | Componentes Involucrados |
|---|-------|-------------------------|
| 1 | Upload video → Ver resultado | `VideoTranslator`, `VideoPredictionResults` |
| 2 | Upload .pkl → Ver predicción | `SampleUploader`, `PredictionResult` |
| 3 | Batch upload → Ver resultados | `ExpertPanel` |
| 4 | Cambio entre modos | `App.jsx` |
| 5 | Drag & drop de archivos | `VideoTranslator`, `ExpertPanel` |
| 6 | Validación archivo inválido | Todos los uploaders |
| 7 | Manejo de error de red | Cualquier componente |
| 8 | Reset de secuencia | `ExpertPanel` |
| 9 | UI de loading | Todos |
| 10 | Cerrar toast de error | `App.jsx` |

### 4.4 Escenarios UI + API para Katalon

1. **Upload video + validar respuesta API**: Subir video → interceptar request → validar payload → verificar UI con respuesta
2. **Error de backend + UI feedback**: Simular error 500 → verificar toast de error
3. **Batch processing con archivos mixtos**: Subir válidos + inválidos → verificar filtrado + llamada API

---

## 5. RESULTADO FINAL

### 5.1 Resumen Ejecutivo

| Aspecto | Descripción |
|---------|-------------|
| **Tipo de Frontend** | SPA React sin router, basada en modos |
| **Complejidad** | Media - 9 componentes, sin estado global |
| **API Communication** | fetch nativo + WebSocket |
| **Autenticación** | ❌ No implementada |
| **Testabilidad** | Alta para E2E, media para unitarias |

### 5.2 Recomendaciones de Pruebas

#### 10 Pruebas E2E con Cypress

| # | Test Case | Descripción |
|---|-----------|-------------|
| 1 | `upload-single-video.cy.js` | Subir 1 video .mp4 → verificar resultado con gloss y confianza |
| 2 | `upload-multiple-videos.cy.js` | Subir 3 videos → verificar tabla de resultados |
| 3 | `upload-pkl-sample.cy.js` | Subir .pkl → verificar top-k predicciones |
| 4 | `expert-panel-single.cy.js` | ExpertPanel: subir 1 .pkl → verificar aceptado/rechazado |
| 5 | `expert-panel-batch.cy.js` | ExpertPanel: subir 5 .pkl → verificar summary batch |
| 6 | `mode-switching.cy.js` | Cambiar entre los 4 modos → verificar UI actualizada |
| 7 | `file-validation.cy.js` | Intentar subir .txt → verificar mensaje de error |
| 8 | `drag-drop-upload.cy.js` | Drag & drop video → verificar preview |
| 9 | `sequence-reset.cy.js` | Subir archivos → reset → verificar secuencia vacía |
| 10 | `error-handling.cy.js` | Simular API error → verificar toast y recuperación |

#### 3 Pruebas UI + API para Katalon

| # | Test Case | Descripción |
|---|-----------|-------------|
| 1 | `video-inference-e2e` | Capturar request multipart → validar headers → verificar response binds a UI |
| 2 | `expert-batch-evaluation` | Interceptar `/infer/batch/evaluate` → validar `files[]` → verificar summary cards |
| 3 | `error-recovery-flow` | Mock 503 → verificar toast → retry → verificar success |

---

### 5.3 Data-TestId Recomendados para Testing

```jsx
// Selectores recomendados para Cypress
data-testid="mode-button-video"
data-testid="mode-button-expert"
data-testid="mode-button-sample"
data-testid="mode-button-camera"
data-testid="video-drop-zone"
data-testid="submit-button"
data-testid="loading-spinner"
data-testid="error-toast"
data-testid="prediction-result"
data-testid="file-list-item"
```

### 5.4 Dependencias Críticas para Testing

```json
{
  "devDependencies": {
    "cypress": "^13.x",
    "@testing-library/react": "^14.x",
    "msw": "^2.x"
  }
}
```

---

## 6. DIAGRAMA DE FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Video   │    │  Expert  │    │  Sample  │    │  Camera  │  │
│  │Translator│    │  Panel   │    │ Uploader │    │ Capture  │  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Layer (fetch)                     │   │
│  │  - videoApi.js (inferFromVideos, getVideoInfo)          │   │
│  │  - config.js (API_BASE_URL, endpoints)                  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼ HTTP/WebSocket
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│  https://comsigns-multimodal-production.up.railway.app         │
├────────────────────────────────────────────────────────────────┤
│  POST /infer              - PKL inference                      │
│  POST /infer/evaluate     - Expert evaluation                  │
│  POST /infer/batch/evaluate - Batch processing                 │
│  POST /api/video/infer    - Video inference                    │
│  GET  /health             - Health check                       │
│  WS   /ws/infer           - Real-time inference                │
└────────────────────────────────────────────────────────────────┘
```

---

*Documento generado el 8 de febrero de 2026*
