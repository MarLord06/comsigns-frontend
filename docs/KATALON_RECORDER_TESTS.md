# Pruebas Automatizadas en Katalon Recorder - Comsigns

## Información General

| Campo | Valor |
|-------|-------|
| **Proyecto** | Comsigns Frontend |
| **Herramienta** | Katalon Recorder |
| **Tipo de Pruebas** | UI + API Integration |
| **Fecha de Diseño** | 9 de febrero de 2026 |

---

## PRUEBA 1: Upload de Video con Validación Completa

**Nombre:** TC001_UploadVideo_InferenceFlow  
**Tipo:** UI + API  
**Precondiciones:** Aplicación accesible en localhost:5173 o URL de producción

### Pasos de Ejecución

| # | Comando | Target | Value |
|---|---------|--------|-------|
| 1 | open | ${BASE_URL} | |
| 2 | waitForElementPresent | css=.video-translator | 10000 |
| 3 | verifyElementPresent | css=.drop-zone | |
| 4 | storeEval | new Date().getTime() | timestamp |
| 5 | comment | LIMITACIÓN: Subir archivo manualmente durante pausa | |
| 6 | pause | 5000 | Usuario sube video manualmente |
| 7 | waitForElementPresent | css=.file-item | 10000 |
| 8 | verifyElementPresent | css=.file-name | |
| 9 | click | css=.translate-btn | |
| 10 | waitForElementPresent | css=.translate-btn .spinner | 3000 |
| 11 | verifyElementPresent | css=.translate-btn[disabled] | |
| 12 | waitForElementNotPresent | css=.translate-btn .spinner | 120000 |
| 13 | waitForElementPresent | css=.video-prediction-results | 5000 |
| 14 | verifyElementPresent | css=.results-summary | |
| 15 | verifyElementPresent | css=.result-card | |
| 16 | verifyText | css=.gloss-label | Palabra reconocida: |
| 17 | verifyElementPresent | css=.gloss-value | |
| 18 | verifyElementPresent | css=.confidence-bar | |
| 19 | verifyElementPresent | css=.status-badge | |
| 20 | captureEntirePageScreenshot | TC001_resultado_${timestamp}.png | |

> **IMPORTANTE - Limitación de Katalon Recorder:**
> Los navegadores bloquean la asignación programática de archivos a inputs `type="file"` por seguridad.
> Durante la pausa (paso 6), el usuario debe arrastrar o seleccionar el archivo manualmente.

### Validaciones API (Network Inspector)

| Campo | Valor Esperado |
|-------|----------------|
| Request | `POST /api/video/infer` |
| Content-Type | `multipart/form-data` |
| Status | `200 OK` |
| Response Body | Contiene: `gloss`, `score`, `accepted`, `class_name` |

### Variables de Datos (Data-Driven)

| VIDEO_PATH | EXPECTED_MIN_CONFIDENCE |
|------------|-------------------------|
| cypress/fixtures/sample-video.mp4 | 0.3 |
| cypress/fixtures/sample-video-2.mp4 | 0.3 |

### Resultado Esperado

- Video aparece en lista de archivos
- Botón muestra spinner durante procesamiento
- Resultados muestran palabra reconocida (gloss)
- Barra de confianza visible con porcentaje
- Badge de estado (aceptado/rechazado) presente

### Evidencia Generada

- Screenshot: `TC001_resultado_[timestamp].png`
- Log de ejecución con tiempos de respuesta
- Reporte HTML con pasos pass/fail

---

## PRUEBA 2: Manejo de Error de Backend

**Nombre:** TC002_ErrorHandling_InvalidFile  
**Tipo:** UI + API  
**Precondiciones:** Archivo inválido preparado (texto.txt)

### Pasos de Ejecución

| # | Comando | Target | Value |
|---|---------|--------|-------|
| 1 | open | ${BASE_URL} | |
| 2 | waitForElementPresent | css=.video-translator | 10000 |
| 3 | storeEval | new Date().getTime() | timestamp |
| 4 | comment | LIMITACIÓN: Subir archivo .txt manualmente durante pausa | |
| 5 | pause | 5000 | Usuario sube archivo inválido |
| 6 | waitForElementPresent | css=.file-item | 10000 |
| 7 | verifyElementPresent | css=.file-item.invalid | |
| 8 | verifyText | css=.file-status | Formato inválido |
| 9 | verifyElementPresent | css=.translate-btn[disabled] | |
| 10 | captureEntirePageScreenshot | TC002_archivo_invalido_${timestamp}.png | |
| 11 | click | css=.clear-btn | |
| 12 | waitForElementNotPresent | css=.file-item | 3000 |
| 13 | comment | Subir video válido manualmente durante pausa | |
| 14 | pause | 5000 | Usuario sube video válido |
| 15 | waitForElementPresent | css=.file-item | 10000 |
| 16 | click | css=.translate-btn | |
| 17 | waitForElementPresent | css=.translate-btn .spinner | 3000 |
| 18 | waitForElementNotPresent | css=.translate-btn .spinner | 120000 |
| 19 | assertElementPresent | css=.video-prediction-results, css=.error-message | |
| 20 | captureEntirePageScreenshot | TC002_resultado_${timestamp}.png | |

> **IMPORTANTE:** Durante las pausas (pasos 5 y 14), el usuario debe subir los archivos manualmente.

### Validaciones para Archivo Inválido

| Validación | Criterio |
|------------|----------|
| UI muestra clase `.invalid` | En el file-item |
| Botón de traducir | Deshabilitado |
| Mensaje visible | "Formato inválido" |

### Validaciones API (Error 500 simulado)

| Campo | Valor |
|-------|-------|
| Request | `POST /api/video/infer` |
| Status | `500 Internal Server Error` |
| Response | `{ "detail": "Error message" }` |

### Variables de Datos

| INVALID_FILE_PATH | EXPECTED_ERROR_MSG |
|-------------------|-------------------|
| cypress/fixtures/invalid.txt | Formato inválido |
| cypress/fixtures/fake.doc | Formato inválido |

### Resultado Esperado

- Archivos inválidos marcados con indicador visual
- Botón deshabilitado cuando solo hay archivos inválidos
- Mensaje de error claro para el usuario
- Aplicación permanece estable después del error

### Evidencia Generada

- Screenshot: `TC002_archivo_invalido_[timestamp].png`
- Screenshot: `TC002_resultado_[timestamp].png`
- Log con validaciones de elementos de error

---

## PRUEBA 3: Batch Processing en ExpertPanel

**Nombre:** TC003_ExpertPanel_BatchEvaluate  
**Tipo:** UI + API  
**Precondiciones:** Múltiples archivos .pkl disponibles en fixtures

### Pasos de Ejecución

| # | Comando | Target | Value |
|---|---------|--------|-------|
| 1 | open | ${BASE_URL} | |
| 2 | waitForElementPresent | css=.mode-selector | 10000 |
| 3 | storeEval | new Date().getTime() | timestamp |
| 4 | click | xpath=//button[contains(@class,'mode-btn') and contains(text(),'Sistema Experto')] | |
| 5 | waitForElementPresent | css=.expert-panel | 5000 |
| 6 | verifyElementPresent | css=.drop-zone | |
| 7 | comment | LIMITACIÓN: Katalon Recorder no puede subir archivos directamente | |
| 8 | comment | Usar interacción manual o Katalon Studio para file upload | |
| 9 | pause | 5000 | Usuario sube archivos manualmente |
| 10 | waitForElementPresent | css=.file-item | 10000 |
| 11 | verifyXpathCount | //div[contains(@class,'file-item')] | 3 |
| 12 | verifyText | css=.btn-infer | Inferir Batch (3) |
| 13 | click | css=.btn-infer | |
| 14 | waitForElementPresent | css=.btn-infer .spinner | 3000 |
| 15 | verifyText | css=.btn-infer | Procesando... |
| 16 | verifyElementPresent | css=.btn-infer[disabled] | |
| 17 | waitForElementNotPresent | css=.btn-infer .spinner | 120000 |
| 18 | waitForElementPresent | css=.batch-results | 5000 |
| 19 | verifyElementPresent | css=.summary-section | |
| 20 | verifyElementPresent | css=.summary-item.total | |
| 21 | verifyElementPresent | css=.summary-item.accepted | |
| 22 | verifyElementPresent | css=.summary-item.rejected | |
| 23 | verifyXpathCount | //div[contains(@class,'result-row')] | 3 |
| 24 | verifyElementPresent | css=.badge.accepted, css=.badge.rejected | |
| 25 | verifyElementPresent | css=.sequence-section | |
| 26 | verifyElementPresent | css=.sequence-display | |
| 27 | captureEntirePageScreenshot | TC003_batch_results_${timestamp}.png | |
| 28 | storeText | css=.summary-item.total .summary-value | totalCount |
| 29 | verifyEval | ${totalCount} == 3 | true |
| 30 | captureEntirePageScreenshot | TC003_summary_${timestamp}.png | |

> **IMPORTANTE - Limitación de Katalon Recorder:**
> Los navegadores bloquean la asignación programática de archivos a inputs `type="file"` por seguridad.
> 
> **Alternativas:**
> 1. **Pausa manual:** El test hace pausa y el usuario sube archivos manualmente
> 2. **Katalon Studio:** Usar la versión de escritorio que tiene soporte nativo
> 3. **Cypress/Selenium:** Estas herramientas tienen APIs específicas para file upload

### Validaciones API

| Campo | Valor Esperado |
|-------|----------------|
| Request | `POST /infer/batch/evaluate` |
| Content-Type | `multipart/form-data` |
| Body | Múltiples archivos .pkl |
| Status | `200 OK` |

### Estructura de Response Esperada

```json
{
  "summary": {
    "total": 3,
    "accepted": "<number>",
    "rejected": "<number>"
  },
  "results": [
    { 
      "file": "string", 
      "gloss": "string", 
      "score": "number", 
      "accepted": "boolean" 
    }
  ],
  "sequence": ["palabra1", "palabra2", "palabra3"]
}
```

### Variables de Datos (Data-Driven)

| PKL_FILE_1 | PKL_FILE_2 | PKL_FILE_3 | EXPECTED_TOTAL |
|------------|------------|------------|----------------|
| sample-features.pkl | sample-features-2.pkl | sample-features-3.pkl | 3 |
| batch-1.pkl | batch-2.pkl | batch-3.pkl | 3 |

### Resultado Esperado

- 3 archivos visibles en lista antes de enviar
- Botón muestra conteo correcto "(3)"
- Spinner durante procesamiento
- Resumen muestra totales: Total, Aceptados, Rechazados
- Cada archivo tiene badge de estado individual
- Secuencia de palabras visible
- Conteo de resultados coincide con archivos enviados

### Evidencia Generada

- Screenshot: `TC003_batch_results_[timestamp].png`
- Screenshot: `TC003_summary_[timestamp].png`
- Reporte HTML con métricas de tiempo de procesamiento batch
- Log con conteos de aceptados/rechazados

---

## Configuración Global de Katalon Recorder

### Test Suite

**Nombre:** Comsigns_Integration_Suite

### Variables Globales

```properties
BASE_URL = http://localhost:5173
VIDEO_PATH = /path/to/cypress/fixtures/sample-video.mp4
PKL_FILE_1 = /path/to/cypress/fixtures/sample-features.pkl
PKL_FILE_2 = /path/to/cypress/fixtures/sample-features-2.pkl
PKL_FILE_3 = /path/to/cypress/fixtures/sample-features-3.pkl
INVALID_FILE_PATH = /path/to/cypress/fixtures/invalid.txt
```

### Configuración de Reporte

| Parámetro | Valor |
|-----------|-------|
| Formato | HTML + JSON |
| Screenshots | En cada paso crítico y al finalizar |
| Timeout Default | 30 segundos |
| Timeout Inference | 120 segundos |

---

## Resumen de Cobertura

| Prueba | Endpoint | Flujo UI | Validación API |
|--------|----------|----------|----------------|
| TC001 | POST /api/video/infer | Upload → Traducir → Resultados | Status 200, JSON structure |
| TC002 | POST /api/video/infer | Upload inválido → Error visible | Status validation, error handling |
| TC003 | POST /infer/batch/evaluate | Modo Experto → Batch → Summary | Status 200, batch results |
