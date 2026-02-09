/**
 * Test 10: Manejo de Error del Backend (500)
 * 
 * OBJETIVO:
 * Verificar que la aplicación maneja correctamente los errores del backend,
 * mostrando mensajes de error apropiados, permitiendo cerrar el toast
 * y recuperándose del estado de error.
 * 
 * SUPOSICIONES:
 * - Los errores se muestran en un toast con clase .error-toast
 * - El toast tiene un botón para cerrarlo (.close-btn)
 * - El backend devuelve { detail: "mensaje de error" } en errores
 */

describe('10 - Manejo de Error del Backend (500)', () => {

  describe('Error en VideoTranslator', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('debe mostrar toast de error cuando el backend devuelve 500', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 500,
        body: {
          detail: 'Error interno del servidor al procesar el video'
        }
      }).as('videoInferError');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInferError');

      // Verificar toast de error
      cy.get('.error-toast').should('be.visible');
      cy.get('.error-toast').should('contain.text', 'Error interno del servidor');
      cy.get('.error-icon').should('contain', '⚠️');
    });

    it('debe mostrar error genérico si no hay detail', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 500,
        body: {}
      }).as('videoInferError');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInferError');

      cy.get('.error-toast').should('be.visible');
    });

    it('debe permitir cerrar el toast de error', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 500,
        body: { detail: 'Error de prueba' }
      }).as('videoInferError');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInferError');

      // Cerrar el toast
      cy.get('.error-toast .close-btn').click();

      // Verificar que desaparece
      cy.get('.error-toast').should('not.exist');
    });

    it('debe recuperar el estado y permitir reintentar', () => {
      let requestCount = 0;
      cy.intercept('POST', '**/api/video/infer*', (req) => {
        requestCount++;
        if (requestCount === 1) {
          req.reply({ statusCode: 500, body: { detail: 'Primer intento falló' } });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              results: [{ video: 'v.mp4', gloss: 'OK', score: 0.9, accepted: true, class_id: 1, class_name: 'H1', reason: 'OK' }],
              errors: []
            }
          });
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      
      // Primer intento - falla
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');
      cy.get('.error-toast').should('be.visible');
      cy.get('.error-toast .close-btn').click();

      // Los archivos deben seguir ahí (limpiamos y re-agregamos por simplicidad)
      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );

      // Segundo intento - éxito
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');
      
      // Ahora debe mostrar resultados
      cy.get('.video-prediction-results').should('be.visible');
      cy.contains('.gloss-value', 'OK').should('be.visible');
    });

    it('debe manejar error de red (network failure)', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        forceNetworkError: true
      }).as('networkError');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();

      // Debe mostrar algún tipo de error
      cy.get('.error-toast', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Error en SampleUploader', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Inferir Sample').click();
    });

    it('debe mostrar toast de error en inferencia de sample', () => {
      cy.intercept('POST', '**/infer?topk=*', {
        statusCode: 500,
        body: { detail: 'Modelo no disponible' }
      }).as('sampleInferError');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.contains('button', 'Inferir Seña').click();
      cy.wait('@sampleInferError');

      cy.get('.error-toast').should('be.visible');
      cy.contains('Modelo no disponible').should('be.visible');
    });

    it('debe terminar el estado de loading después del error', () => {
      cy.intercept('POST', '**/infer?topk=*', {
        statusCode: 503,
        body: { detail: 'Servicio no disponible' }
      }).as('sampleInferError');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.contains('button', 'Inferir Seña').click();
      cy.wait('@sampleInferError');

      // El loading debe terminar
      cy.get('.loading-indicator').should('not.exist');
      cy.get('.spinner').should('not.exist');
      
      // El botón debe volver a estar habilitado
      cy.contains('button', 'Inferir Seña').should('not.be.disabled');
    });
  });

  describe('Error en ExpertPanel', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Sistema Experto').click();
    });

    it('debe mostrar error en batch evaluation', () => {
      // Single file uses /infer/evaluate endpoint
      cy.intercept('POST', '**/infer/evaluate', {
        statusCode: 500,
        body: { detail: 'Error procesando batch' }
      }).as('batchError');

      cy.get('.expert-panel input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.get('.btn-infer').click();
      cy.wait('@batchError');

      cy.get('.error-message').should('be.visible');
      cy.contains('Error procesando batch').should('be.visible');
    });

    it('debe manejar timeout largo de inferencia', () => {
      // Single file uses /infer/evaluate endpoint
      cy.intercept('POST', '**/infer/evaluate', {
        delay: 65000, // 65 segundos - excede timeout típico
        statusCode: 200,
        body: { summary: {}, results: [], errors: [], sequence: [] }
      }).as('longRequest');

      cy.get('.expert-panel input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.get('.btn-infer').click();

      // Verificar que sigue mostrando loading
      cy.get('.btn-infer .spinner', { timeout: 5000 }).should('be.visible');
      
      // Nota: Este test verifica que la UI maneja requests largos
      // En producción, podría haber un timeout del cliente
    });
  });

  describe('Múltiples errores', () => {
    it('debe mostrar solo un toast a la vez', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 500,
        body: { detail: 'Error 1' }
      }).as('error1');

      cy.visit('/');
      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@error1');

      // Solo debe haber un toast
      cy.get('.error-toast').should('have.length', 1);
    });
  });
});
