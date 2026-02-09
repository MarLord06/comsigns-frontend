/**
 * Test 04: Upload de Múltiples Videos
 * 
 * OBJETIVO:
 * Verificar el flujo de subir múltiples videos simultáneamente,
 * ver la lista de archivos y los resultados por cada video.
 * 
 * SUPOSICIONES:
 * - El input acepta atributo "multiple"
 * - Se puede seleccionar varios archivos a la vez
 * - Los resultados muestran un card por cada video
 */

describe('04 - Upload de Múltiples Videos', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('.mode-btn.active', 'Traducir Video').should('exist');
  });

  it('debe permitir seleccionar múltiples videos', () => {
    // Seleccionar múltiples archivos
    cy.get('.video-translator input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-video.mp4',
        'cypress/fixtures/sample-video-2.mp4',
        'cypress/fixtures/sample-video-3.mp4'
      ],
      { force: true }
    );

    // Verificar que aparecen los 3 en la lista
    cy.get('.file-item').should('have.length', 3);
    cy.contains('3 video(s) seleccionado(s)').should('be.visible');
  });

  it('debe mostrar el botón con el conteo correcto', () => {
    cy.get('.video-translator input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-video.mp4',
        'cypress/fixtures/sample-video-2.mp4'
      ],
      { force: true }
    );

    cy.get('.translate-btn')
      .should('contain.text', 'Traducir 2 videos');
  });

  it('debe poder eliminar un video individual de la lista', () => {
    cy.get('.video-translator input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-video.mp4',
        'cypress/fixtures/sample-video-2.mp4'
      ],
      { force: true }
    );

    // Eliminar el primero
    cy.get('.file-item').first().find('.remove-btn').click();

    // Verificar que queda solo uno
    cy.get('.file-item').should('have.length', 1);
    cy.contains('1 video(s) seleccionado(s)').should('be.visible');
  });

  it('debe mostrar resultados para cada video después de inferencia', () => {
    // Interceptar llamada real al backend (sin mock)
    cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

    cy.get('.video-translator input[type="file"]').selectFile(
      [
        'cypress/fixtures/sample-video.mp4',
        'cypress/fixtures/sample-video-2.mp4',
        'cypress/fixtures/sample-video-3.mp4'
      ],
      { force: true }
    );

    cy.get('.translate-btn').click();
    cy.wait('@videoInfer', { timeout: 120000 });

    // Verificar summary (valores reales del backend)
    cy.get('.results-summary').should('be.visible');

    // Verificar que hay 3 cards (uno por video)
    cy.get('.result-card').should('have.length', 3);
    
    // Verificar que cada resultado tiene un gloss
    cy.get('.gloss-value').should('have.length', 3);
  });

  it('debe mostrar las palabras reconocidas en el summary', () => {
    // Interceptar llamada real al backend (sin mock)
    cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

    cy.get('.video-translator input[type="file"]').selectFile(
      ['cypress/fixtures/sample-video.mp4', 'cypress/fixtures/sample-video-2.mp4'],
      { force: true }
    );

    cy.get('.translate-btn').click();
    cy.wait('@videoInfer', { timeout: 120000 });

    // Verificar resultados con palabras reconocidas
    cy.get('.results-summary').should('be.visible');
    cy.contains('Palabra reconocida').should('be.visible');
    cy.get('.gloss-value').should('have.length.at.least', 1);
  });
});
