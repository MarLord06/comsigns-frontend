# 🧪 Tests E2E con Cypress - Comsigns Frontend

## Estructura del Proyecto

```
cypress/
├── e2e/                              # Tests E2E
│   ├── 01-initial-load.cy.js         # Carga inicial de la SPA
│   ├── 02-mode-switching.cy.js       # Cambio entre modos
│   ├── 03-upload-single-video.cy.js  # Upload video único
│   ├── 04-upload-multiple-videos.cy.js # Upload múltiples videos
│   ├── 05-upload-pkl-sample.cy.js    # Upload archivo .pkl
│   ├── 06-expert-panel-batch.cy.js   # Batch processing
│   ├── 07-file-validation.cy.js      # Validación de archivos
│   ├── 08-loading-state.cy.js        # Estados de carga
│   ├── 09-results-rendering.cy.js    # Render de resultados
│   └── 10-error-handling.cy.js       # Manejo de errores
├── fixtures/                         # Archivos de prueba
│   ├── sample-video.mp4
│   ├── sample-video-2.mp4
│   ├── sample-video-3.mp4
│   ├── sample-features.pkl
│   ├── sample-features-2.pkl
│   ├── sample-features-3.pkl
│   ├── invalid-file.txt
│   ├── invalid-image.png
│   └── create-fixtures.sh
└── support/
    ├── e2e.js                        # Configuración global
    └── commands.js                   # Comandos personalizados
```

---

## 📋 Resumen de Tests

### Test 01: Carga Inicial de la SPA
**Archivo**: `01-initial-load.cy.js`

**Objetivo**: Verificar que la aplicación carga correctamente.

**Casos de prueba**:
- ✅ Muestra header con logo y título "COMSIGNS"
- ✅ Muestra los 4 botones de navegación por modo
- ✅ Modo "video" está activo por defecto
- ✅ Muestra zona de drop para videos
- ✅ Muestra footer con versión
- ✅ No hay errores visibles al cargar

---

### Test 02: Cambio entre Modos
**Archivo**: `02-mode-switching.cy.js`

**Objetivo**: Verificar la navegación entre modos sin router.

**Casos de prueba**:
- ✅ Cambiar al modo "Sistema Experto"
- ✅ Cambiar al modo "Inferir Sample"
- ✅ Cambiar al modo "Cámara en Vivo"
- ✅ Volver al modo "Traducir Video"
- ✅ Solo un modo activo a la vez
- ✅ Contenido del modo anterior se oculta

---

### Test 03: Upload de Video Único
**Archivo**: `03-upload-single-video.cy.js`

**Objetivo**: Flujo completo de subir y procesar un video.

**Casos de prueba**:
- ✅ Muestra video seleccionado en la lista
- ✅ Botón de traducir habilitado
- ✅ Envía video y muestra estado de carga
- ✅ Muestra resultados después de inferencia
- ✅ Eliminar video de la lista
- ✅ Limpiar todos los videos

---

### Test 04: Upload de Múltiples Videos
**Archivo**: `04-upload-multiple-videos.cy.js`

**Objetivo**: Subir y procesar múltiples videos.

**Casos de prueba**:
- ✅ Seleccionar múltiples videos
- ✅ Botón muestra conteo correcto
- ✅ Eliminar video individual de la lista
- ✅ Muestra resultados por cada video
- ✅ Muestra palabras reconocidas en summary

---

### Test 05: Upload de Archivo .pkl
**Archivo**: `05-upload-pkl-sample.cy.js`

**Objetivo**: Flujo de inferencia con archivos de features.

**Casos de prueba**:
- ✅ Muestra área de upload para .pkl
- ✅ Muestra archivo seleccionado
- ✅ Selector de Top-K visible
- ✅ Cambiar valor de Top-K
- ✅ Botón de inferir habilitado
- ✅ Muestra estado de carga
- ✅ Muestra resultados top-k
- ✅ Limpiar archivo seleccionado

---

### Test 06: Batch Processing en ExpertPanel
**Archivo**: `06-expert-panel-batch.cy.js`

**Objetivo**: Procesamiento batch de múltiples .pkl.

**Casos de prueba**:
- ✅ Panel de input con drop zone
- ✅ Seleccionar múltiples .pkl
- ✅ Botón de inferir batch
- ✅ Resultados con summary (processed, accepted, rejected)
- ✅ Badges de aceptado/rechazado por archivo
- ✅ Eliminar archivo de la lista
- ✅ Limpiar todos los archivos

---

### Test 07: Validación de Archivos Inválidos
**Archivo**: `07-file-validation.cy.js`

**Objetivo**: Validación de tipos y extensiones.

**Casos de prueba**:
- ✅ VideoTranslator rechaza .txt
- ✅ VideoTranslator rechaza .png
- ✅ Muestra error count en header
- ✅ Deshabilita envío si todos son inválidos
- ✅ Permite enviar solo válidos
- ✅ SampleUploader rechaza no-.pkl
- ✅ ExpertPanel ignora no-.pkl
- ✅ Muestra mensaje de archivos ignorados

---

### Test 08: Estado de Loading
**Archivo**: `08-loading-state.cy.js`

**Objetivo**: Verificar feedback visual durante operaciones.

**Casos de prueba**:
- ✅ Spinner durante inferencia de video
- ✅ Botón Limpiar deshabilitado durante loading
- ✅ Botones de eliminar deshabilitados durante loading
- ✅ Indicador de carga en SampleUploader
- ✅ Texto de procesamiento batch en ExpertPanel

---

### Test 09: Render de Resultados
**Archivo**: `09-results-rendering.cy.js`

**Objetivo**: Verificar visualización correcta de resultados.

**Casos de prueba**:
- ✅ Renderiza gloss de cada video
- ✅ Muestra score como porcentaje
- ✅ Barra de confianza visual
- ✅ Colores según nivel de confianza
- ✅ Diferencia visual aceptados/rechazados
- ✅ Muestra razón de aceptación/rechazo
- ✅ Gloss principal destacado en .pkl
- ✅ Lista de top-k predicciones
- ✅ Badge OTHER para predicciones is_other

---

### Test 10: Manejo de Error del Backend
**Archivo**: `10-error-handling.cy.js`

**Objetivo**: Verificar manejo de errores 500 y network.

**Casos de prueba**:
- ✅ Toast de error cuando backend devuelve 500
- ✅ Mensaje genérico si no hay detail
- ✅ Cerrar toast de error
- ✅ Recuperar estado y reintentar
- ✅ Manejar error de red (network failure)
- ✅ Error en SampleUploader
- ✅ Terminar loading después del error
- ✅ Error en ExpertPanel batch
- ✅ Solo un toast a la vez

---

## 🚀 Comandos de Ejecución

```bash
# Instalar dependencias (incluye Cypress)
npm install

# Crear fixtures de prueba
cd cypress/fixtures && bash create-fixtures.sh

# Abrir Cypress en modo interactivo
npm run cy:open

# Ejecutar todos los tests en modo headless
npm run cy:run

# Ejecutar tests con navegador visible
npm run cy:run:headed

# Iniciar servidor de desarrollo + ejecutar tests
npm run test:e2e

# Iniciar servidor + abrir Cypress interactivo
npm run test:e2e:open
```

---

## 🔧 Comandos Personalizados

Definidos en `cypress/support/commands.js`:

| Comando | Descripción |
|---------|-------------|
| `cy.switchMode('video')` | Cambiar al modo especificado |
| `cy.waitForInference(timeout)` | Esperar que termine la inferencia |
| `cy.assertNotLoading()` | Verificar que no hay loading |
| `cy.assertErrorToast(msg)` | Verificar toast de error |
| `cy.closeErrorToast()` | Cerrar toast de error |
| `cy.uploadFile(selector, path)` | Subir archivo |
| `cy.assertAppLoaded()` | Verificar que la app cargó |

---

## ⚠️ Notas Importantes

1. **Sin autenticación**: Los tests no incluyen login/logout porque la app no tiene autenticación.

2. **Sin router**: La navegación es por estado interno (`mode`), no hay rutas URL.

3. **Mocking de API**: Los tests usan `cy.intercept()` para mockear respuestas del backend en la mayoría de casos.

4. **Timeouts**: La inferencia ML puede tardar, se configuran timeouts de 60 segundos.

5. **Fixtures**: Los videos de prueba son placeholders. Para tests completos con el backend real, usa videos reales de señas.

6. **Selectores**: Se priorizan selectores por clase CSS ya que no hay `data-testid` en el código actual.

---

## 📈 Métricas de Cobertura

| Área | Tests | Casos |
|------|-------|-------|
| Carga inicial | 1 | 6 |
| Navegación | 1 | 6 |
| Video upload | 2 | 11 |
| .pkl upload | 1 | 8 |
| Batch processing | 1 | 7 |
| Validación | 1 | 8 |
| Loading states | 1 | 6 |
| Resultados | 1 | 9 |
| Error handling | 1 | 9 |
| **TOTAL** | **10** | **70** |

---

*Generado para Comsigns Frontend - Febrero 2026*
