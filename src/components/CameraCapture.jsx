/**
 * CameraCapture - Componente de Captura en Tiempo Real con MediaPipe Hands
 *
 * FUNCIONALIDAD:
 * - Captura de video desde webcam
 * - Detección de landmarks de manos usando MediaPipe Hands
 * - Dibujo visual de landmarks en tiempo real
 * - Envío de frames al backend para inferencia
 * - Manejo robusto de errores y reconexión
 *
 * DEPENDENCIAS:
 * - @mediapipe/hands: Detección de landmarks de manos
 * - @mediapipe/camera_utils: Utilidades para manejo de cámara
 * - @mediapipe/drawing_utils: Dibujo de landmarks
 *
 * ESTADOS:
 * - isActive: Si la cámara está activa
 * - isProcessing: Si se está procesando un frame
 * - connectionStatus: Estado de la conexión WebSocket
 * - handsReady: Si MediaPipe Hands está inicializado
 * - error: Mensaje de error actual
 *
 * VALIDACIÓN DE ERRORES:
 * - Permisos de cámara denegados
 * - Dispositivos de cámara no disponibles
 * - Errores de inicialización de MediaPipe
 * - Errores de conexión WebSocket
 * - Timeouts de procesamiento
 *
 * BUENAS PRÁCTICAS:
 * - Cleanup adecuado de recursos (WebSocket, MediaPipe, streams)
 * - Manejo de memoria eficiente
 * - Logging detallado para debugging
 * - Estados de loading claros
 * - Reconexión automática con backoff exponencial
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { WS_BASE_URL } from '../api/config'
import './CameraCapture.css'

// Configuración de MediaPipe Hands
const HANDS_CONFIG = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  }
}

// Configuración de la aplicación
const APP_CONFIG = {
  CAPTURE_FPS: 10, // Frames por segundo a capturar
  FRAME_WIDTH: 640,
  FRAME_HEIGHT: 480,
  WS_URL: `${WS_BASE_URL}/ws/infer`,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_BASE_DELAY: 1000, // ms
  PROCESSING_TIMEOUT: 5000, // ms
  HANDS_MODEL_COMPLEXITY: 1, // 0-2 (0: simple, 2: complejo)
  HANDS_MAX_NUM_HANDS: 2,
  HANDS_MIN_DETECTION_CONFIDENCE: 0.5,
  HANDS_MIN_TRACKING_CONFIDENCE: 0.5
}

function CameraCapture({ onPrediction, onError }) {
  // Refs para elementos DOM y objetos MediaPipe
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const processingLockRef = useRef(false)
  const captureIntervalRef = useRef(null)
  const processingTimeoutRef = useRef(null)

  // Estados del componente
  const [isActive, setIsActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [handsReady, setHandsReady] = useState(false)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [frameCount, setFrameCount] = useState(0)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [cameraPermission, setCameraPermission] = useState('unknown')

  // Estado para las utilidades de dibujo de MediaPipe
  const [drawingUtils, setDrawingUtils] = useState(null)

  // Estado para tracking de landmarks
  const [landmarksDetected, setLandmarksDetected] = useState(0)
  const [isProcessingHands, setIsProcessingHands] = useState(false)

  /**
   * Inicializa MediaPipe Hands y Drawing Utils
   * Maneja errores de inicialización y configuración
   */
  const initializeHands = useCallback(async () => {
    try {
      // Avoid running during SSR/build (Vercel) — only run in browser
      if (typeof window === 'undefined') {
        console.warn('initializeHands skipped: no window (SSR)')
        return
      }

      console.log('🎯 Inicializando MediaPipe Hands...')

      // Importar dinámicamente para mejor manejo de errores
      const HandsModule = await import('@mediapipe/hands')
      const CameraModule = await import('@mediapipe/camera_utils')
      const DrawingModule = await import('@mediapipe/drawing_utils')

      // Debug: registrar la forma de los módulos importados (ayuda con bundlers/SSR)
      console.log('[Debug] Módulos MediaPipe importados:', {
        HandsModule, CameraModule, DrawingModule
      })

      // Resolver constructor de Hands robustamente (buscar en default/nested exports)
      const deepFindCtor = (mod) => {
        if (!mod) return null
        if (typeof mod === 'function') return mod
        if (typeof mod === 'object') {
          if (typeof mod.Hands === 'function') return mod.Hands
          if (typeof mod.default === 'function') return mod.default
          if (mod.default && typeof mod.default === 'object') {
            if (typeof mod.default.Hands === 'function') return mod.default.Hands
            if (typeof mod.default.default === 'function') return mod.default.default
          }
          // Buscar recursivamente en propiedades
          for (const k of Object.keys(mod)) {
            try {
              const v = mod[k]
              if (typeof v === 'function') return v
              if (v && typeof v === 'object') {
                const nested = deepFindCtor(v)
                if (nested) return nested
              }
            } catch (e) {
              // ignore access errors
            }
          }
        }
        return null
      }

      const HandsCtor = deepFindCtor(HandsModule)
      console.log('[Debug] deep HandsModule keys:', HandsModule && Object.keys(HandsModule))
      if (HandsModule?.default && typeof HandsModule.default === 'object') {
        console.log('[Debug] HandsModule.default keys:', Object.keys(HandsModule.default))
      }

      // Si no conseguimos el constructor por import dinámico, intentar cargar desde CDN (fallback para entornos como Vercel)
      const loadScript = (src) => new Promise((resolve, reject) => {
        try {
          const s = document.createElement('script')
          s.src = src
          s.async = true
          s.onload = () => resolve()
          s.onerror = (e) => reject(new Error('Error cargando script ' + src))
          document.head.appendChild(s)
        } catch (e) {
          reject(e)
        }
      })

      const tryResolveFromGlobals = () => {
        const candidates = [
          window?.Hands,
          window?.hands,
          window?.Mediapipe,
          window?.mediapipe,
          window?.MPHands,
          window?.mpHands
        ]
        for (const c of candidates) {
          if (!c) continue
          if (typeof c === 'function') return c
          if (typeof c.Hands === 'function') return c.Hands
          if (typeof c.default === 'function') return c.default
          if (c.default && typeof c.default.Hands === 'function') return c.default.Hands
        }
        // try top-level globals
        if (typeof window?.Hands === 'function') return window.Hands
        if (typeof window?.Camera === 'function') return window.Camera
        return null
      }

      let resolvedHandsCtor = HandsCtor
      if (!resolvedHandsCtor) {
        console.warn('[Warn] Hands constructor no encontrado por import dinámico — intentando CDN fallback')
        try {
          // Cargar UMD builds desde jsdeliver
          await loadScript(HANDS_CONFIG.locateFile('hands.js'))
          await loadScript(HANDS_CONFIG.locateFile('camera_utils.js'))
          await loadScript(HANDS_CONFIG.locateFile('drawing_utils.js'))

          console.log('[Debug] Scripts CDN cargados, verificando globals...')
          resolvedHandsCtor = tryResolveFromGlobals()
          console.log('[Debug] resolvedHandsCtor desde globals:', !!resolvedHandsCtor, resolvedHandsCtor && resolvedHandsCtor.name)
        } catch (cdnErr) {
          console.error('[Error] Error cargando MediaPipe desde CDN:', cdnErr)
        }
      }

      // Asignar finalmente el constructor que vayamos a usar
      const FinalHandsCtor = resolvedHandsCtor || HandsCtor

      // Resolver Camera y drawing utils con fallback razonable
      const Camera = CameraModule?.Camera || CameraModule?.default?.Camera || CameraModule?.default || CameraModule
      const drawConnectors = DrawingModule?.drawConnectors || DrawingModule?.default?.drawConnectors
      const drawLandmarks = DrawingModule?.drawLandmarks || DrawingModule?.default?.drawLandmarks
      const HAND_CONNECTIONS = DrawingModule?.HAND_CONNECTIONS || DrawingModule?.default?.HAND_CONNECTIONS

      if (!FinalHandsCtor) {
        const shape = HandsModule && typeof HandsModule === 'object' ? Object.keys(HandsModule) : String(HandsModule)
        throw new Error('MediaPipe Hands constructor not available after import or CDN fallback. Module keys: ' + JSON.stringify(shape) + '. Revisa consola para globals disponibles.')
      }

      console.log('[Debug] Hands constructor resuelto:', !!FinalHandsCtor, FinalHandsCtor && FinalHandsCtor.name)

      // Validar Camera (resolver formas de exportación)
      if (!Camera) {
        const cameraKeys = CameraModule && typeof CameraModule === 'object' ? Object.keys(CameraModule) : String(CameraModule)
        throw new Error('MediaPipe Camera not available after import. CameraModule keys: ' + JSON.stringify(cameraKeys))
      }

      // Crear instancia de Hands
      const hands = new FinalHandsCtor({
        locateFile: HANDS_CONFIG.locateFile
      })

      // Configurar opciones de Hands
      hands.setOptions({
        maxNumHands: APP_CONFIG.HANDS_MAX_NUM_HANDS,
        modelComplexity: APP_CONFIG.HANDS_MODEL_COMPLEXITY,
        minDetectionConfidence: APP_CONFIG.HANDS_MIN_DETECTION_CONFIDENCE,
        minTrackingConfidence: APP_CONFIG.HANDS_MIN_TRACKING_CONFIDENCE
      })

      // Fallback HAND_CONNECTIONS (used if drawing_utils doesn't provide it)
      const HAND_CONNECTIONS_FALLBACK = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],
        [0,17]
      ]

      // Simple renderer fallback when drawing_utils is not available
      const fallbackRender = (ctx, landmarks, color = '#00FF00') => {
        if (!ctx || !landmarks) return
        const w = canvasRef.current?.width || APP_CONFIG.FRAME_WIDTH
        const h = canvasRef.current?.height || APP_CONFIG.FRAME_HEIGHT

        // draw points
        ctx.fillStyle = color
        landmarks.forEach(pt => {
          const x = pt.x * w
          const y = pt.y * h
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fill()
        })
      }

      // Callback cuando se detectan resultados
      const onResults = (results) => {
        console.log('[Log] 🖐️ Resultados MediaPipe Hands:', results)
        if (!canvasRef.current || !videoRef.current) {
          console.warn('[Warn] Canvas o video no disponible para dibujar.')
          return
        }
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Dibujar video en canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        // Dibujar landmarks si existen
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          results.multiHandLandmarks.forEach((landmarks, idx) => {
            console.log(`[Log] 🖐️ Landmarks detectados (mano ${idx + 1}):`, landmarks)

            // Prefer drawing_utils if available
            if (typeof drawLandmarks === 'function' && typeof drawConnectors === 'function' && (HAND_CONNECTIONS || HAND_CONNECTIONS_FALLBACK)) {
              try {
                const connectors = HAND_CONNECTIONS || HAND_CONNECTIONS_FALLBACK
                // draw connectors then landmarks points
                drawConnectors(ctx, landmarks, connectors, { color: idx === 0 ? '#00FF00' : '#FF0000', lineWidth: 2 })
                drawLandmarks(ctx, landmarks, { color: idx === 0 ? '#00FF00' : '#FF0000', lineWidth: 1 })
                console.log('[Log] 🖌️ Landmarks dibujados con drawing_utils.')
              } catch (e) {
                console.warn('[Warn] drawing_utils falló, usando fallback renderer:', e)
                fallbackRender(ctx, landmarks, idx === 0 ? '#00FF00' : '#FF0000')
              }
            } else {
              // Use fallback renderer
              console.warn('[Warn] drawing_utils no está disponible, usando fallback.')
              fallbackRender(ctx, landmarks, idx === 0 ? '#00FF00' : '#FF0000')
            }
          })
        } else {
          console.log('[Log] 🖐️ No se detectaron landmarks en este frame.')
        }
      }

      handsRef.current = hands;
      // Register callback correctly using MediaPipe API
      if (typeof hands.onResults === 'function') {
        hands.onResults(onResults)
        console.log('[Log] hands.onResults registrado con callback (método)')
      } else {
        // Fallback: assign property (older builds)
        handsRef.current.onResults = onResults
        console.log('[Warn] hands.onResults no es función, asignado como propiedad')
      }
      // Log para confirmar asignación y callback
      console.log('[Log] handsRef.current asignado:', !!handsRef.current);
      console.log('[Log] handsRef.current.onResults asignado:', !!handsRef.current.onResults);
      setDrawingUtils({ drawConnectors, drawLandmarks, HAND_CONNECTIONS })
      setHandsReady(true);
      console.log('✅ MediaPipe Hands inicializado correctamente');
    } catch (err) {
      const msg = err?.message || String(err)
      const errorMsg = 'Error inicializando MediaPipe Hands: ' + msg
      console.error('[Error] MediaPipe Hands:', err)
      setError(errorMsg)
      if (onError) onError(errorMsg)
    }
  }, [onError])

  /**
   * Dibuja los landmarks de las manos en el canvas
   * Incluye conexiones entre puntos y colores diferenciados
   */
  const drawLandmarks = useCallback((results) => {
    setIsProcessingHands(false) // Reset processing state

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) {
      console.error('❌ Canvas o contexto no disponible:', { canvas: !!canvas, ctx: !!ctx })
      return
    }

    if (!drawingUtils) {
      console.error('❌ Drawing utils no disponible')
      return
    }

    console.log('🎨 Dibujando en canvas:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      ctx: !!ctx,
      results: !!results,
      multiHandLandmarks: results?.multiHandLandmarks?.length || 0
    })

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Log para verificar que se está dibujando
    console.log('🖼️ Limpiando y dibujando en canvas:', { width: canvas.width, height: canvas.height })

    // Si no hay resultados, salir
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      console.log('🤷 No se detectaron landmarks')
      setLandmarksDetected(0)
      return
    }

    try {
      const { drawConnectors, drawLandmarks: drawLandmarksPoints, HAND_CONNECTIONS } = drawingUtils

      console.log(`👋 Dibujando ${results.multiHandLandmarks.length} mano(s)`)
      setLandmarksDetected(results.multiHandLandmarks.length)

      // Dibujar cada mano detectada
      results.multiHandLandmarks.forEach((landmarks, handIndex) => {
        console.log(`👋 Mano ${handIndex + 1}: ${landmarks.length} landmarks`)

        // Color diferente para cada mano
        const color = handIndex === 0 ? '#00FF00' : '#FF0000' // Verde para mano derecha, rojo para izquierda

        // Dibujar conexiones entre landmarks
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: color,
          lineWidth: 2
        })

        // Dibujar puntos de landmarks
        drawLandmarksPoints(ctx, landmarks, {
          color: color,
          lineWidth: 1,
          radius: 3
        })
      })

      // Información de debug (opcional)
      if (results.multiHandedness) {
        ctx.fillStyle = 'white'
        ctx.font = '16px Arial'
        ctx.fillText(`Manos detectadas: ${results.multiHandLandmarks.length}`, 10, 30)

        results.multiHandedness.forEach((handedness, index) => {
          const label = handedness.label // 'Left' o 'Right'
          const score = (handedness.score * 100).toFixed(1)
          ctx.fillText(`${label}: ${score}%`, 10, 50 + (index * 20))
        })
      }

    } catch (err) {
      console.error('❌ Error dibujando landmarks:', err)
    }
  }, [drawingUtils])

  /**
   * Verifica permisos de cámara
   * Maneja diferentes estados de permisos del navegador
   */
  const checkCameraPermission = useCallback(async () => {
    try {
      console.log('📷 Verificando permisos de cámara...')

      // Verificar si la API de permisos está disponible
      if (!navigator.permissions) {
        console.warn('⚠️ API de permisos no disponible')
        setCameraPermission('unknown')
        return
      }

      const permission = await navigator.permissions.query({ name: 'camera' })

      setCameraPermission(permission.state)

      permission.addEventListener('change', () => {
        setCameraPermission(permission.state)
        console.log('📷 Permiso de cámara cambió:', permission.state)
      })

      console.log('📷 Estado del permiso de cámara:', permission.state)

    } catch (err) {
      console.warn('⚠️ Error verificando permisos:', err)
      setCameraPermission('unknown')
    }
  }, [])

  /**
   * Conecta al WebSocket con manejo robusto de errores
   * Incluye reconexión automática con backoff exponencial
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket ya conectado')
      return
    }

    if (reconnectAttempts >= APP_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      const errorMsg = `Máximo número de intentos de reconexión alcanzado (${APP_CONFIG.MAX_RECONNECT_ATTEMPTS})`
      console.error('❌', errorMsg)
      setError(errorMsg)
      setConnectionStatus('failed')
      return
    }

    console.log(`🔌 Conectando WebSocket... (intento ${reconnectAttempts + 1})`)
    setConnectionStatus('connecting')

    try {
      const ws = new WebSocket(APP_CONFIG.WS_URL)

      // Timeout de conexión
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('⏰ Timeout de conexión WebSocket')
          ws.close()
        }
      }, 10000)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log('✅ WebSocket conectado')
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case 'status':
              if (message.status === 'connected') {
                setSessionId(message.session_id)
                console.log('🎯 Sesión iniciada:', message.session_id)
              }
              break

            case 'prediction':
              setIsProcessing(false)
              clearTimeout(processingTimeoutRef.current)
              if (onPrediction) {
                onPrediction(message.data)
              }
              break

            case 'error':
              console.error('❌ Error del servidor:', message.error)
              setError(message.error)
              setIsProcessing(false)
              clearTimeout(processingTimeoutRef.current)
              if (onError) {
                onError(message.error)
              }
              break

            default:
              console.warn('⚠️ Tipo de mensaje desconocido:', message.type)
          }
        } catch (err) {
          console.error('❌ Error parseando mensaje WebSocket:', err)
          setError('Error procesando respuesta del servidor')
        }
      }

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error('❌ Error de WebSocket:', error)
        setConnectionStatus('error')
        setError('Error de conexión WebSocket')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log('🔌 WebSocket desconectado:', event.code, event.reason)
        setConnectionStatus('disconnected')

        // Reconexión automática si la cámara está activa
        if (isActive && event.code !== 1000) { // 1000 = cierre normal
          const delay = Math.min(
            APP_CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts),
            30000 // Máximo 30 segundos
          )

          console.log(`🔄 Reintentando conexión en ${delay}ms...`)
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connectWebSocket()
          }, delay)
        }
      }

      wsRef.current = ws

    } catch (err) {
      console.error('❌ Error creando WebSocket:', err)
      setError('Error inicializando conexión')
      setConnectionStatus('error')
    }
  }, [isActive, reconnectAttempts, onPrediction, onError])

  /**
   * Envía un frame al servidor con timeout de procesamiento
   */
  const sendFrame = useCallback((frameBase64) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket no conectado, omitiendo frame')
      return
    }

    if (isProcessing) {
      console.log('⏳ Procesamiento en curso, omitiendo frame')
      return
    }

    setIsProcessing(true)

    // Timeout de procesamiento
    processingTimeoutRef.current = setTimeout(() => {
      console.error('⏰ Timeout procesando frame')
      setIsProcessing(false)
      setError('Timeout procesando frame')
    }, APP_CONFIG.PROCESSING_TIMEOUT)

    try {
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        session_id: sessionId,
        data: frameBase64,
        timestamp: Date.now()
      }))

      setFrameCount(prev => prev + 1)

    } catch (err) {
      console.error('❌ Error enviando frame:', err)
      setError('Error enviando frame al servidor')
      setIsProcessing(false)
      clearTimeout(processingTimeoutRef.current)
    }
  }, [isProcessing, sessionId])

  /**
   * Inicia la captura de video desde la webcam
   * Incluye validación de dispositivos disponibles
   */
  const startCamera = useCallback(async () => {
    try {
      console.log('📹 Iniciando cámara...')

      // Verificar dispositivos disponibles
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      if (videoDevices.length === 0) {
        throw new Error('No se encontraron dispositivos de video')
      }

      console.log(`📹 Dispositivos de video encontrados: ${videoDevices.length}`)

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: APP_CONFIG.FRAME_WIDTH },
          height: { ideal: APP_CONFIG.FRAME_HEIGHT },
          facingMode: 'user' // Cámara frontal
        }
      })

      streamRef.current = stream

      // Configurar video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve
        })
        // Esperar a que el video esté listo para reproducir
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 3) {
            resolve()
          } else {
            videoRef.current.oncanplay = resolve
          }
        })
        console.log('🎥 Video element configurado y listo para reproducir:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState
        })
      }

      // Configurar canvas
      if (canvasRef.current) {
        canvasRef.current.width = APP_CONFIG.FRAME_WIDTH
        canvasRef.current.height = APP_CONFIG.FRAME_HEIGHT
        console.log('📐 Canvas configurado:', { width: APP_CONFIG.FRAME_WIDTH, height: APP_CONFIG.FRAME_HEIGHT })
      }

      // Iniciar MediaPipe Camera si Hands está listo
      if (handsReady && handsRef.current && drawingUtils) {
        console.log('📹 Iniciando MediaPipe Camera...')
        const CameraClass = cameraRef.current || (await import('@mediapipe/camera_utils')).Camera
        // Log para depuración de videoRef
        console.log('[Log] videoRef.current:', videoRef.current);
        if (!videoRef.current) {
          console.error('[Error] videoRef.current no está disponible para MediaPipe Camera');
          return;
        }
        const cameraInstance = new CameraClass(
          videoRef.current,
          {
            onFrame: async () => {
              console.log('[Log] MediaPipe Camera onFrame ejecutado');
              // Prevent concurrent sends
              if (processingLockRef.current) {
                return
              }

              // Check video readiness before sending to MediaPipe Hands
              if (
                videoRef.current &&
                handsRef.current &&
                videoRef.current.readyState >= 3 && // HAVE_FUTURE_DATA / HAVE_ENOUGH_DATA
                !videoRef.current.paused &&
                !videoRef.current.ended
              ) {
                processingLockRef.current = true
                try {
                  setIsProcessingHands(true)
                  console.log('[Log] Enviando frame a MediaPipe Hands...')

                  // Prefer ImageBitmap for stability/performance
                  if (window.createImageBitmap) {
                    const bitmap = await createImageBitmap(videoRef.current)
                    try {
                      if (typeof handsRef.current.send === 'function') {
                        await handsRef.current.send({ image: bitmap })
                        console.log('[Log] Frame (ImageBitmap) enviado a MediaPipe Hands.')
                      } else {
                        console.error('[Error] handsRef.current.send no es función:', handsRef.current)
                      }
                    } finally {
                      try { bitmap.close() } catch (e) { /* ignore */ }
                    }
                  } else {
                    // Fallback to video element
                    if (typeof handsRef.current.send === 'function') {
                      await handsRef.current.send({ image: videoRef.current })
                      console.log('[Log] Frame (video element) enviado a MediaPipe Hands.')
                    } else {
                      console.error('[Error] handsRef.current.send no es función:', handsRef.current)
                    }
                  }
                } catch (err) {
                  console.error('❌ Error enviando frame a MediaPipe:', err)

                  // If WASM runtime abort detected, attempt graceful reinit
                  const msg = (err && err.message) || ''
                  if (msg.includes('Module.arguments has been replaced') || msg.includes('abort')) {
                    console.error('[Error] WASM abort detectado — reiniciando MediaPipe Hands')
                    try {
                      if (handsRef.current) {
                        try { handsRef.current.close() } catch (e) { /* ignore */ }
                        handsRef.current = null
                      }
                    } catch (closeErr) {
                      console.error('[Error] cerrando hands después del abort:', closeErr)
                    }

                    setHandsReady(false)
                    // Reinitialize after short delay
                    setTimeout(() => {
                      initializeHands().catch(e => console.error('❌ Error re-inicializando Hands:', e))
                    }, 500)
                  }
                } finally {
                  processingLockRef.current = false
                  setIsProcessingHands(false)
                }
              } else {
                console.log('[Log] No se envía frame: videoRef, handsRef o video no listo.', {
                  videoRef: !!videoRef.current,
                  handsRef: !!handsRef.current,
                  readyState: videoRef.current?.readyState,
                  paused: videoRef.current?.paused,
                  ended: videoRef.current?.ended
                })
              }
            },
            width: APP_CONFIG.FRAME_WIDTH,
            height: APP_CONFIG.FRAME_HEIGHT
          }
        );
        cameraInstance.start();
        cameraRef.current = cameraInstance; // Guardar referencia
        console.log('✅ Cámara MediaPipe iniciada');
      } else {
        console.warn('⚠️ MediaPipe no está listo para iniciar cámara:', {
          handsReady,
          cameraRef: !!cameraRef.current,
          handsRef: !!handsRef.current,
          drawingUtils: !!drawingUtils
        });
      }

      // Iniciar captura de frames
      captureIntervalRef.current = setInterval(() => {
        captureAndSendFrame()
      }, 1000 / APP_CONFIG.CAPTURE_FPS)

      setIsActive(true)
      setCameraPermission('granted')
      console.log('✅ Cámara iniciada correctamente')

    } catch (err) {
      console.error('❌ Error iniciando cámara:', err)

      let errorMsg = 'Error desconocido'
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.'
        setCameraPermission('denied')
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No se encontró una cámara. Conecta una cámara e intenta nuevamente.'
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'La cámara está siendo usada por otra aplicación.'
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'La configuración de cámara solicitada no es soportada.'
      } else {
        errorMsg = err.message || 'Error iniciando la cámara'
      }

      setError(errorMsg)
      if (onError) onError(errorMsg)
    }
  }, [handsReady, onError])

  const stopCamera = useCallback(() => {
    console.log('🛑 Deteniendo cámara...')

    // Detener captura de frames
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
      console.log('✅ Intervalo de captura detenido')
    }

    // Limpiar timeout de procesamiento
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
      console.log('✅ Timeout de procesamiento limpiado')
    }

    // Detener MediaPipe Camera - IMPORTANTE: Esto detiene el procesamiento de frames
    if (cameraRef.current && typeof cameraRef.current.stop === 'function') {
      try {
        cameraRef.current.stop()
        cameraRef.current = null // <-- Limpieza explícita
        console.log('✅ MediaPipe Camera detenida y referencia limpiada')
      } catch (err) {
        console.error('❌ Error deteniendo MediaPipe Camera:', err)
      }
    }

    // Detener stream de video
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('✅ Track de video detenido:', track.label)
      })
      streamRef.current = null
    }

    // Limpiar canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        console.log('✅ Canvas limpiado')
      }
    }

    // Resetear estados
    setIsActive(false)
    setFrameCount(0)
    setLandmarksDetected(0)
    setIsProcessingHands(false)
    // Reset processing lock
    processingLockRef.current = false

    console.log('✅ Cámara completamente detenida')
  }, [])

  /**
   * Captura un frame del video y lo envía al servidor
   */
  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !isActive) return

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = APP_CONFIG.FRAME_WIDTH
      canvas.height = APP_CONFIG.FRAME_HEIGHT

      // Dibujar frame del video
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      // Convertir a base64
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.8)

      // Enviar al servidor
      sendFrame(frameBase64)

    } catch (err) {
      console.error('❌ Error capturando frame:', err)
    }
  }, [isActive, sendFrame])

  /**
   * Toggle de la cámara (iniciar/detener)
   */
  const toggleCamera = useCallback(async () => {
    console.log('🔄 Toggle camera:', { isActive, handsReady })

    if (isActive) {
      console.log('🛑 Deteniendo cámara...')
      stopCamera()
      if (wsRef.current) {
        wsRef.current.close(1000, 'Camera stopped')
      }
    } else {
      console.log('▶️ Iniciando cámara...')
      setError(null)
      await checkCameraPermission()
      await startCamera()
      connectWebSocket()
    }
  }, [isActive, startCamera, stopCamera, connectWebSocket, checkCameraPermission])

  /**
   * Cleanup al desmontar el componente
   */
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando recursos...')

      // Detener cámara
      stopCamera()

      // Cerrar WebSocket
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }

      // Limpiar MediaPipe
      if (handsRef.current) {
        try {
          handsRef.current.close()
        } catch (err) {
          console.error('[Error] cerrando hands en cleanup:', err)
        }
        handsRef.current = null
      }
    }
  }, [stopCamera])

  /**
   * Inicializar MediaPipe Hands al montar
   */
  useEffect(() => {
    initializeHands()
    checkCameraPermission()
  }, [initializeHands, checkCameraPermission])

  // Renderizar componente
  return (
    <div className="camera-capture">
      {/* Header */}
      <div className="panel-header">
        <h2>📹 Cámara en Vivo</h2>
        <p>Detección en tiempo real con MediaPipe Hands</p>
      </div>

      {/* Controles */}
      <div className="camera-controls">
        <button
          className={`btn ${isActive ? 'btn-danger' : 'btn-success'} camera-toggle-btn`}
          onClick={toggleCamera}
          disabled={!handsReady}
        >
          {isActive ? '🛑 Detener' : '▶️ Iniciar'} Cámara
        </button>

        {/* Estado de conexión */}
        <div className={`connection-status status-${connectionStatus}`}>
          <span className="status-icon">
            {connectionStatus === 'connected' ? '🟢' :
             connectionStatus === 'connecting' ? '🟡' :
             connectionStatus === 'error' ? '🔴' : '⚪'}
          </span>
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Conectado' :
             connectionStatus === 'connecting' ? 'Conectando...' :
             connectionStatus === 'error' ? 'Error' : 'Desconectado'}
          </span>
        </div>

        {/* Estado de MediaPipe */}
        <div className={`hands-status ${handsReady ? 'ready' : 'loading'}`}>
          <span className="status-icon">{handsReady ? '🤖' : '⏳'}</span>
          <span className="status-text">
            {handsReady ? 'MediaPipe Listo' : 'Cargando MediaPipe...'}
          </span>
        </div>
      </div>

      {/* Información de estado */}
      <div className="camera-info">
        <div className="info-item">
          <span className="info-label">Frames enviados:</span>
          <span className="info-value">{frameCount}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Procesando:</span>
          <span className="info-value">{isProcessing ? 'Sí' : 'No'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Landmarks:</span>
          <span className={`info-value ${landmarksDetected > 0 ? 'landmarks-detected' : ''}`}>
            {landmarksDetected > 0 ? `👋 ${landmarksDetected} mano(s)` : 'Ninguno'}
          </span>
        </div>
      </div>

      {/* Área de video y canvas */}
      <div className="camera-display">
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
            style={{ display: isActive ? 'block' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            className="camera-canvas"
            style={{ display: isActive ? 'block' : 'none' }}
          />

          {/* Indicador de procesamiento de MediaPipe */}
          {isActive && isProcessingHands && (
            <div className="processing-indicator">
              <div className="spinner-small"></div>
            </div>
          )}

          {/* Placeholder cuando no está activo */}
          {!isActive && (
            <div className="camera-placeholder">
              <div className="placeholder-icon">📹</div>
              <div className="placeholder-text">
                {handsReady ? 'Haz clic en "Iniciar Cámara" para comenzar' : 'Cargando MediaPipe...'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
          <button
            className="error-dismiss"
            onClick={() => setError(null)}
            title="Cerrar mensaje de error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="camera-help">
        <h4>💡 Consejos de uso:</h4>
        <ul>
          <li>Asegúrate de tener buena iluminación</li>
          <li>Mantén las manos dentro del marco de la cámara</li>
          <li>Los landmarks se dibujan en verde (mano derecha) y rojo (mano izquierda)</li>
          <li>La detección funciona mejor con fondos contrastantes</li>
        </ul>
      </div>
    </div>
  )
}

export default CameraCapture
