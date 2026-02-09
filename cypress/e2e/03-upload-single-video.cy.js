/**
 * Test 03: Upload de Video Único
 * 
 * OBJETIVO:
 * Verificar el flujo completo de subir un video único, enviarlo al backend
 * para inferencia y mostrar los resultados (gloss, confianza, estado).
 * 
 * SUPOSICIONES:
 * - El video se sube vía input type="file"
 * - El backend responde en menos de 60 segundos
 * - Los resultados incluyen: video name, gloss, score, accepted/rejected
 */

describe('03 - Upload de Video Único', () => {
  beforeEach(() => {
    cy.visit('/');
    // Asegurar que estamos en modo video
    cy.contains('.mode-btn.active', 'Traducir Video').should('exist');
  });

  it('debe mostrar el video seleccionado en la lista', () => {
    // Seleccionar archivo de video
    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    // Verificar que aparece en la lista de archivos
    cy.get('.file-list').should('be.visible');
    cy.get('.file-item').should('have.length', 1);
    cy.contains('.file-name', 'sample-video.mp4').should('be.visible');
    
    // Verificar contador de videos
    cy.contains('1 video(s) seleccionado(s)').should('be.visible');
  });

  it('debe mostrar el botón de traducir habilitado', () => {
    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    // Verificar botón de traducir
    cy.get('.translate-btn')
      .should('be.visible')
      .and('not.be.disabled')
      .and('contain.text', 'Traducir 1 video');
  });

  it('debe enviar el video y mostrar estado de carga', () => {
    // Interceptar la llamada API
    cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    // Click en traducir
    cy.get('.translate-btn').click();

    // Verificar estado de loading
    cy.get('.translate-btn').should('contain.text', 'Procesando');
    cy.get('.translate-btn .spinner').should('exist');
    cy.get('.translate-btn').should('be.disabled');
  });

  it('debe mostrar resultados después de inferencia exitosa', () => {
    // Interceptar la llamada real al backend (sin mock)
    cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    cy.get('.translate-btn').click();

    // Esperar respuesta del backend real
    cy.wait('@videoInfer', { timeout: 120000 });

    // Verificar que se muestran los resultados
    cy.get('.video-prediction-results').should('be.visible');
    
    // Verificar summary
    cy.get('.results-summary').within(() => {
      cy.contains('.summary-label', 'Videos').should('be.visible');
    });

    // Verificar que hay al menos un resultado
    cy.get('.result-card').should('have.length.at.least', 1);
    
    // Verificar que hay un gloss (sin valor específico - depende del backend)
    cy.get('.gloss-value').should('be.visible');
  });

  it('debe poder eliminar el video de la lista antes de enviar', () => {
    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    // Verificar que el video está en la lista
    cy.get('.file-item').should('have.length', 1);

    // Click en el botón de eliminar
    cy.get('.file-item .remove-btn').click();

    // Verificar que la lista está vacía
    cy.get('.file-list').should('not.exist');
    cy.get('.translate-btn').should('not.exist');
  });

  it('debe poder limpiar todos los videos', () => {
    cy.get('.video-translator input[type="file"]').selectFile(
      'cypress/fixtures/sample-video.mp4',
      { force: true }
    );

    cy.get('.file-list').should('be.visible');

    // Click en Limpiar todo
    cy.contains('button', 'Limpiar todo').click();

    // Verificar que se limpiaron
    cy.get('.file-list').should('not.exist');
  });
});
