/**
 * Test 08: Estado de Loading
 * 
 * OBJETIVO:
 * Verificar que la UI muestra correctamente los estados de carga durante
 * las operaciones de inferencia, incluyendo spinners, botones disabled
 * y mensajes de progreso.
 * 
 * SUPOSICIONES:
 * - Los spinners tienen clase .spinner o .spinner-small
 * - Los botones se deshabilitan durante loading
 * - Aparece texto "Procesando..." durante la operación
 */

describe('08 - Estado de Loading', () => {
  
  describe('VideoTranslator Loading', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('debe mostrar spinner durante inferencia de video', () => {
      // Interceptar llamada real al backend (sin mock)
      cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );

      cy.get('.translate-btn').click();

      // Verificar estado de loading (inmediatamente después del click)
      cy.get('.translate-btn .spinner').should('be.visible');
      cy.get('.translate-btn').should('contain.text', 'Procesando');
      cy.get('.translate-btn').should('be.disabled');

      // Esperar a que termine
      cy.wait('@videoInfer', { timeout: 120000 });
      cy.get('.translate-btn .spinner').should('not.exist');
    });

    it('debe deshabilitar el botón Limpiar todo durante loading', () => {
      cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );

      cy.get('.translate-btn').click();

      // El botón de limpiar debe estar deshabilitado durante el loading
      cy.contains('button', 'Limpiar todo').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@videoInfer', { timeout: 120000 });
    });

    it('debe deshabilitar botones de eliminar archivo durante loading', () => {
      cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );

      cy.get('.translate-btn').click();

      // Los botones de remover archivo deben estar deshabilitados
      cy.get('.remove-btn').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@videoInfer', { timeout: 120000 });
    });
  });

  describe('SampleUploader Loading', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Inferir Sample').click();
    });

    it('debe mostrar indicador de carga durante inferencia', () => {
      cy.intercept('POST', '**/infer?topk=*').as('sampleInfer');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );

      cy.contains('button', 'Inferir Seña').click();

      // Verificar loading indicator (inmediatamente después del click)
      cy.get('.loading-indicator').should('be.visible');
      cy.get('.spinner').should('be.visible');

      // Verificar botón disabled
      cy.get('.btn-primary').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@sampleInfer', { timeout: 120000 });
    });

    it('debe deshabilitar botón Limpiar durante loading', () => {
      cy.intercept('POST', '**/infer?topk=*').as('sampleInfer');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );

      cy.contains('button', 'Inferir Seña').click();

      cy.contains('button', 'Limpiar').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@sampleInfer', { timeout: 120000 });
    });
  });

  describe('ExpertPanel Loading', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Sistema Experto').click();
    });

    it('debe mostrar texto de procesamiento batch', () => {
      // Multiple files use /infer/batch/evaluate
      cy.intercept('POST', '**/infer/batch/evaluate').as('batchEvaluate');

      cy.get('.expert-panel input[type="file"]').selectFile(
        [
          'cypress/fixtures/sample-features.pkl',
          'cypress/fixtures/sample-features-2.pkl'
        ],
        { force: true }
      );

      cy.get('.btn-infer', { timeout: 5000 })
        .should('be.visible')
        .and('not.be.disabled')
        .click();

      // Verificar texto de procesamiento (inmediatamente después del click)
      cy.get('.btn-infer').should('contain.text', 'Procesando');
      cy.get('.btn-infer .spinner').should('be.visible');
      cy.get('.btn-infer').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@batchEvaluate', { timeout: 120000 });
    });

    it('debe mantener el estado de loading hasta que el backend responda', () => {
      // Single file uses /infer/evaluate
      cy.intercept('POST', '**/infer/evaluate').as('singleEvaluate');

      cy.get('.expert-panel input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );

      cy.get('.btn-infer', { timeout: 5000 })
        .should('be.visible')
        .and('not.be.disabled')
        .click();

      // Verificar que está en loading
      cy.get('.btn-infer .spinner').should('be.visible');
      cy.get('.btn-infer').should('be.disabled');
      
      // Esperar a que termine
      cy.wait('@singleEvaluate', { timeout: 120000 });
      
      // Verificar que ya no está en loading
      cy.get('.btn-infer .spinner').should('not.exist');
    });
  });
});
