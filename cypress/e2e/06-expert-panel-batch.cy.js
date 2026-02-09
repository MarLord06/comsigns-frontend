/**
 * Test 06: Batch Processing en ExpertPanel
 * 
 * OBJETIVO:
 * Verificar el flujo de subir múltiples archivos .pkl en el Sistema Experto,
 * ver el procesamiento batch y los resultados con decisiones de aceptación/rechazo.
 * 
 * SUPOSICIONES:
 * - Múltiples archivos .pkl se envían a POST /infer/batch/evaluate
 * - Respuesta incluye summary (processed, accepted, rejected) y results array
 * - Cada resultado tiene: file_name, prediction (gloss, confidence, bucket, accepted, reason)
 */

describe('06 - Batch Processing en ExpertPanel', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('.mode-btn', 'Sistema Experto').click();
    cy.get('.expert-panel').should('be.visible');
  });

  it('debe mostrar el panel de input con drop zone', () => {
    cy.contains('h2', '📹 Video Input').should('be.visible');
    cy.contains('Sube uno o varios samples de señas (.pkl)').should('be.visible');
    cy.get('.drop-zone').should('be.visible');
    cy.contains('Arrastra archivos aquí o haz clic para seleccionar').should('be.visible');
  });

  it('debe permitir seleccionar múltiples archivos .pkl', () => {
    cy.get('.expert-panel input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-features.pkl',
        'cypress/fixtures/sample-features-2.pkl',
        'cypress/fixtures/sample-features-3.pkl'
      ],
      { force: true }
    );

    // Verificar contador
    cy.contains('3 archivos seleccionados').should('be.visible');
    
    // Verificar lista de archivos
    cy.get('.files-list').should('be.visible');
    cy.get('.file-item').should('have.length', 3);
  });

  it('debe mostrar el botón de inferir batch', () => {
    cy.get('.expert-panel input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-features.pkl',
        'cypress/fixtures/sample-features-2.pkl'
      ],
      { force: true }
    );

    // Esperar a que el botón esté visible y habilitado
    cy.get('.btn-infer', { timeout: 5000 })
      .should('be.visible')
      .and('not.be.disabled')
      .and('contain.text', 'Inferir 2 archivos');
  });

  it('debe enviar batch y mostrar resultados con summary', () => {
    // Interceptar llamada real al backend (sin mock)
    cy.intercept('POST', '**/infer/batch/evaluate').as('batchEvaluate');

    cy.get('.expert-panel input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-features.pkl',
        'cypress/fixtures/sample-features-2.pkl',
        'cypress/fixtures/sample-features-3.pkl'
      ],
      { force: true }
    );

    // Esperar a que el botón esté habilitado después de procesar archivos
    cy.get('.btn-infer', { timeout: 5000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    cy.wait('@batchEvaluate', { timeout: 120000 });

    // Verificar título de resultados batch
    cy.contains('h2', 'Resultados del Batch').should('be.visible');

    // Verificar summary stats (valores reales del backend)
    cy.get('.batch-summary').should('be.visible');
    cy.get('.batch-summary').within(() => {
      cy.contains('.stat-label', 'Procesados').should('be.visible');
    });

    // Verificar que hay cards de resultados
    cy.get('.batch-result-card').should('have.length', 3);
  });

  it('debe mostrar badges de aceptado/rechazado por archivo', () => {
    // Interceptar llamada real al backend (sin mock)
    cy.intercept('POST', '**/infer/batch/evaluate').as('batchEvaluate');

    cy.get('.expert-panel input[type="file"]').selectFile(
      ['cypress/fixtures/sample-features.pkl', 'cypress/fixtures/sample-features-2.pkl'],
      { force: true }
    );

    // Esperar a que el botón esté habilitado después de procesar archivos
    cy.get('.btn-infer', { timeout: 5000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    cy.wait('@batchEvaluate', { timeout: 120000 });

    // Verificar que hay badges de decisión (aceptado o rechazado según respuesta real)
    cy.get('.result-decision-badge').should('have.length.at.least', 1);
  });

  it('debe poder eliminar un archivo de la lista antes de enviar', () => {
    cy.get('.expert-panel input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-features.pkl',
        'cypress/fixtures/sample-features-2.pkl'
      ],
      { force: true }
    );

    cy.get('.file-item').should('have.length', 2);

    // Eliminar uno
    cy.get('.file-item').first().find('.file-item-remove').click();

    cy.get('.file-item').should('have.length', 1);
    cy.contains('1 archivo seleccionado').should('be.visible');
  });

  it('debe poder limpiar todos los archivos', () => {
    cy.get('.expert-panel input[type="file"]').selectFile(
      ['cypress/fixtures/sample-features.pkl', 'cypress/fixtures/sample-features-2.pkl'],
      { force: true }
    );

    cy.contains('button', 'Limpiar todo').click();

    cy.get('.files-list').should('not.exist');
    cy.contains('Arrastra archivos aquí').should('be.visible');
  });
});
