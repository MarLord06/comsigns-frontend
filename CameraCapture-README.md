# CameraCapture Component - Guía de Uso

## Descripción
El componente `CameraCapture` es un componente React avanzado que combina captura de video en tiempo real con detección de landmarks de manos usando MediaPipe Hands.

## Características Principales

### 🎥 Captura de Video
- Acceso a webcam del usuario con manejo robusto de permisos
- Configuración automática de resolución (640x480)
- Soporte para múltiples dispositivos de video

### 🤖 Detección de Manos con MediaPipe
- Detección de hasta 2 manos simultáneamente
- 21 landmarks por mano (puntos de articulación)
- Diferenciación automática entre mano izquierda y derecha
- Dibujo visual de conexiones entre landmarks

### 🔄 Conexión WebSocket
- Envío automático de frames al backend cada 100ms
- Reconexión automática con backoff exponencial
- Manejo de timeouts y errores de conexión

### 🎨 Interfaz de Usuario
- Estados visuales claros (conectado, procesando, error)
- Información en tiempo real (frames enviados, landmarks detectados)
- Mensajes de ayuda y consejos de uso
- Diseño responsivo

## Estados del Componente

```javascript
{
  isActive: false,           // Si la cámara está activa
  isProcessing: false,       // Si se está procesando un frame
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'error' | 'disconnected'
  handsReady: false,         // Si MediaPipe Hands está inicializado
  landmarksDetected: 0,      // Número de manos detectadas
  error: null,               // Mensaje de error actual
  cameraPermission: 'unknown' // 'granted' | 'denied' | 'prompt' | 'unknown'
}
```

## Uso Básico

```jsx
import CameraCapture from './components/CameraCapture'

function App() {
  const handlePrediction = (data) => {
    console.log('Predicción recibida:', data)
  }

  const handleError = (error) => {
    console.error('Error:', error)
  }

  return (
    <CameraCapture
      onPrediction={handlePrediction}
      onError={handleError}
    />
  )
}
```

## Configuración

El componente incluye configuración predefinida optimizada:

```javascript
const APP_CONFIG = {
  CAPTURE_FPS: 10,              // Frames por segundo
  FRAME_WIDTH: 640,             // Ancho del frame
  FRAME_HEIGHT: 480,            // Alto del frame
  WS_URL: `${WS_BASE_URL}/ws/infer`, // URL del WebSocket
  MAX_RECONNECT_ATTEMPTS: 5,    // Máximo intentos de reconexión
  RECONNECT_BASE_DELAY: 1000,   // Delay base para reconexión (ms)
  PROCESSING_TIMEOUT: 5000,     // Timeout de procesamiento (ms)
  HANDS_MODEL_COMPLEXITY: 1,    // Complejidad del modelo (0-2)
  HANDS_MAX_NUM_HANDS: 2,       // Máximo número de manos
  HANDS_MIN_DETECTION_CONFIDENCE: 0.5, // Confianza mínima de detección
  HANDS_MIN_TRACKING_CONFIDENCE: 0.5   // Confianza mínima de tracking
}
```

## Debugging

### Logs de Consola
El componente incluye logging detallado para debugging:

- `🎯 Inicializando MediaPipe Hands...` - Inicio de inicialización
- `✅ MediaPipe Hands inicializado correctamente` - Inicialización exitosa
- `📹 Iniciando MediaPipe Camera...` - Inicio de captura
- `🎯 Resultados de MediaPipe:` - Resultados de detección
- `👋 Dibujando X mano(s)` - Dibujo de landmarks
- `🤷 No se detectaron landmarks` - Sin detección

### Estados Visuales
- **Frames enviados**: Número total de frames enviados al backend
- **Procesando**: Indica si hay procesamiento activo
- **Landmarks**: Muestra número de manos detectadas con animación
- **Permiso cámara**: Estado de permisos del navegador

## Solución de Problemas

### Landmarks no se dibujan
1. Verificar que MediaPipe esté inicializado (`handsReady: true`)
2. Comprobar permisos de cámara
3. Asegurar buena iluminación
4. Verificar que las manos estén dentro del marco

### Errores de conexión WebSocket
1. Verificar que el backend esté ejecutándose
2. Comprobar configuración de `WS_BASE_URL`
3. Revisar logs de red en DevTools

### Problemas de rendimiento
1. Reducir `CAPTURE_FPS` si es necesario
2. Ajustar `HANDS_MODEL_COMPLEXITY` (valores más bajos = mejor rendimiento)
3. Verificar que el dispositivo tenga suficiente poder de procesamiento

## Mejores Prácticas

### Iluminación
- Buena iluminación frontal
- Evitar fondos muy brillantes o contrastantes
- Mantener las manos bien visibles

### Posicionamiento
- Manos centradas en el marco
- Distancia adecuada de la cámara (30-50cm)
- Evitar movimientos bruscos

### Rendimiento
- El componente está optimizado para 10 FPS
- Procesamiento en tiempo real puede consumir recursos
- Considerar límites de batería en dispositivos móviles

## API Reference

### Props
- `onPrediction(data)` - Callback cuando se recibe una predicción
- `onError(error)` - Callback cuando ocurre un error

### Estados Internos
- `isActive` - Controla si la cámara está activa
- `connectionStatus` - Estado de la conexión WebSocket
- `handsReady` - Estado de inicialización de MediaPipe
- `landmarksDetected` - Número de manos detectadas
- `error` - Mensaje de error actual

## Dependencias

```json
{
  "@mediapipe/hands": "^0.4.1675469240",
  "@mediapipe/camera_utils": "^0.3.1675469240",
  "@mediapipe/drawing_utils": "^0.3.1675469240"
}
```

## Compatibilidad

- **Navegadores**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Dispositivos**: Desktop, tablets, smartphones con webcam
- **Sistemas Operativos**: Windows, macOS, Linux, iOS, Android

## Contribución

Para modificar o extender el componente:

1. El código está bien documentado con JSDoc
2. Estados y efectos están claramente separados
3. Manejo de errores es robusto
4. Logging detallado facilita debugging
5. CSS usa variables CSS para temas

## Próximas Mejores

- [ ] Soporte para gestos predefinidos
- [ ] Configuración personalizable vía props
- [ ] Modo offline para testing
- [ ] Grabación de video con landmarks
- [ ] Exportación de datos de landmarks</content>
<parameter name="filePath">/Users/marloveper__/Documents/proyectos/COMSIGNS-FRONTEND/CameraCapture-README.md