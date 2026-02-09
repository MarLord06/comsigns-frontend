/**
 * Test 05: Upload de Archivo .pkl (Sample)
 * 
 * OBJETIVO:
 * Verificar el flujo de subir un archivo .pkl de features pre-extraídos
 * en el modo "Inferir Sample" y ver los resultados top-k.
 * 
 * SUPOSICIONES:
 * - Solo acepta archivos .pkl
 * - Muestra selector de Top-K (3, 5, 10)
 * - El endpoint es POST /infer
 * - Los resultados incluyen top1 y topk array
 */

describe('05 - Upload de Archivo .pkl (Sample)', () => {
  beforeEach(() => {
    cy.visit('/');
    // Cambiar a modo Sample
    cy.contains('.mode-btn', 'Inferir Sample').click();
    cy.get('.sample-uploader').should('be.visible');
  });

  it('debe mostrar el área de upload para archivos .pkl', () => {
    cy.get('.sample-uploader .upload-area').should('be.visible');
    cy.contains('Arrastra un sample aquí o haz clic para seleccionar').should('be.visible');
    cy.contains('Formato soportado: .pkl').should('be.visible');
  });

  it('debe mostrar el archivo seleccionado', () => {
    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    // Verificar que se muestra el archivo
    cy.contains('sample-features.pkl').should('be.visible');
    cy.get('.file-icon').should('contain', '📦');
  });

  it('debe mostrar selector de Top-K después de seleccionar archivo', () => {
    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    // Verificar selector de topk
    cy.get('.topk-selector').should('be.visible');
    cy.contains('label', 'Top-K predicciones').should('be.visible');
    cy.get('#topk').should('have.value', '5'); // Default es 5
  });

  it('debe permitir cambiar el valor de Top-K', () => {
    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    // Cambiar a Top 10
    cy.get('#topk').select('10');
    cy.get('#topk').should('have.value', '10');

    // Cambiar a Top 3
    cy.get('#topk').select('3');
    cy.get('#topk').should('have.value', '3');
  });

  it('debe mostrar botón de inferir habilitado', () => {
    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    cy.get('.sample-uploader .btn-primary')
      .should('be.visible')
      .and('not.be.disabled')
      .and('contain.text', 'Inferir Seña');
  });

  it('debe enviar el sample y mostrar estado de carga', () => {
    cy.intercept('POST', '**/infer?topk=*').as('sampleInfer');

    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    cy.contains('button', 'Inferir Seña').click();

    // Verificar estado de loading
    cy.contains('Procesando').should('be.visible');
    cy.get('.loading-indicator').should('be.visible');
    cy.contains('Ejecutando inferencia').should('be.visible');
  });

  it('debe mostrar resultados top-k después de inferencia exitosa', () => {
    // Interceptar llamada real al backend (sin mock)
    cy.intercept('POST', '**/infer?topk=*').as('sampleInfer');

    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    cy.contains('button', 'Inferir Seña').click();
    cy.wait('@sampleInfer', { timeout: 120000 });

    // Verificar resultado principal
    cy.get('.prediction-result').should('be.visible');
    cy.contains('Predicción Principal').should('be.visible');
    
    // Verificar que hay un gloss (valor real del backend)
    cy.get('.gloss-text').should('be.visible');
    
    // Verificar que hay confianza
    cy.get('.confidence-value, .confidence-bar').should('exist');

    // Verificar lista top-k
    cy.contains('Top').should('be.visible');
    cy.get('.topk-item').should('have.length.at.least', 1);
  });

  it('debe poder limpiar el archivo seleccionado', () => {
    cy.get('.sample-uploader input[type="file"]').selectFile(
      'cypress/fixtures/sample-features.pkl',
      { force: true }
    );

    cy.contains('sample-features.pkl').should('be.visible');

    // Click en Limpiar
    cy.contains('button', 'Limpiar').click();

    // Verificar que vuelve al estado inicial
    cy.contains('Arrastra un sample aquí').should('be.visible');
    cy.get('.topk-selector').should('not.exist');
  });
});
