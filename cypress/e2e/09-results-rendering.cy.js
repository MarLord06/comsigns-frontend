/**
 * Test 09: Render de Resultados (Gloss, Confidence)
 * 
 * OBJETIVO:
 * Verificar que los resultados de inferencia se renderizan correctamente,
 * mostrando el gloss (palabra), confidence (confianza), barras de progreso
 * y estados de aceptación/rechazo.
 * 
 * SUPOSICIONES:
 * - El gloss se muestra en elementos con clase .gloss-value o .gloss-text
 * - La confianza se muestra como porcentaje
 * - Hay barras de confianza visuales
 * - Estados: accepted (verde), rejected (rojo)
 */

describe('09 - Render de Resultados (Gloss, Confidence)', () => {

  describe('VideoPredictionResults - Resultados de Video', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('debe renderizar correctamente el gloss de cada video', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'v1.mp4', gloss: 'HOLA', score: 0.95, accepted: true, class_id: 1, class_name: 'H1', reason: 'OK' },
            { video: 'v2.mp4', gloss: 'MUNDO', score: 0.80, accepted: true, class_id: 2, class_name: 'H2', reason: 'OK' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        ['cypress/fixtures/sample-video.mp4', 'cypress/fixtures/sample-video-2.mp4'],
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      // Verificar gloss de cada resultado
      cy.get('.result-card').eq(0).within(() => {
        cy.get('.gloss-value').should('have.text', 'HOLA');
      });
      cy.get('.result-card').eq(1).within(() => {
        cy.get('.gloss-value').should('have.text', 'MUNDO');
      });
    });

    it('debe mostrar el score como porcentaje', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'v1.mp4', gloss: 'TEST', score: 0.873, accepted: true, class_id: 1, class_name: 'H1', reason: 'OK' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      // Verificar confianza formateada
      cy.get('.confidence-value').should('contain.text', '87.3%');
    });

    it('debe mostrar barra de confianza visual', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'v1.mp4', gloss: 'TEST', score: 0.75, accepted: true, class_id: 1, class_name: 'H1', reason: 'OK' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      // Verificar barra de confianza
      cy.get('.confidence-bar-container').should('be.visible');
      cy.get('.confidence-bar')
        .should('be.visible')
        .and('have.css', 'width')
        .and('not.equal', '0px');
    });

    it('debe aplicar colores según el nivel de confianza', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'high.mp4', gloss: 'HIGH', score: 0.85, accepted: true, class_id: 1, class_name: 'H1', reason: 'OK' },
            { video: 'low.mp4', gloss: 'LOW', score: 0.25, accepted: false, class_id: 2, class_name: 'H2', reason: 'Bajo' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        ['cypress/fixtures/sample-video.mp4', 'cypress/fixtures/sample-video-2.mp4'],
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      // Verificar clases de color
      cy.get('.confidence-value.high').should('exist');
      cy.get('.confidence-value.low').should('exist');
    });

    it('debe diferenciar visualmente resultados aceptados y rechazados', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'ok.mp4', gloss: 'OK', score: 0.9, accepted: true, class_id: 1, class_name: 'H1', reason: 'Aceptado' },
            { video: 'no.mp4', gloss: 'NO', score: 0.2, accepted: false, class_id: 2, class_name: 'H2', reason: 'Rechazado' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        ['cypress/fixtures/sample-video.mp4', 'cypress/fixtures/sample-video-2.mp4'],
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      // Verificar estilos diferenciados
      cy.get('.result-card.accepted').should('have.length', 1);
      cy.get('.result-card.rejected').should('have.length', 1);

      // Verificar labels de estado
      cy.contains('✅ Aceptada').should('be.visible');
      cy.contains('❌ Rechazada').should('be.visible');
    });

    it('debe mostrar la razón de aceptación/rechazo', () => {
      cy.intercept('POST', '**/api/video/infer*', {
        statusCode: 200,
        body: {
          results: [
            { video: 'v.mp4', gloss: 'X', score: 0.3, accepted: false, class_id: 1, class_name: 'H1', reason: 'Confianza muy baja (30%)' }
          ],
          errors: []
        }
      }).as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );
      cy.get('.translate-btn').click();
      cy.wait('@videoInfer');

      cy.get('.status-reason').should('contain.text', 'Confianza muy baja (30%)');
    });
  });

  describe('PredictionResult - Resultados de Sample .pkl', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Inferir Sample').click();
    });

    it('debe renderizar el gloss principal destacado', () => {
      cy.intercept('POST', '**/infer?topk=*', {
        statusCode: 200,
        body: {
          top1: { gloss: 'GRACIAS', confidence: 0.88, bucket: 'HEAD', is_other: false, new_class_id: 10, old_class_id: 10 },
          topk: [{ rank: 1, gloss: 'GRACIAS', confidence: 0.88, bucket: 'HEAD', is_other: false }],
          meta: { model: 'v1' }
        }
      }).as('sampleInfer');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.contains('button', 'Inferir Seña').click();
      cy.wait('@sampleInfer');

      // Verificar gloss principal
      cy.get('.top1-card .gloss-text').should('have.text', 'GRACIAS');
    });

    it('debe mostrar la lista de top-k predicciones', () => {
      cy.intercept('POST', '**/infer?topk=*', {
        statusCode: 200,
        body: {
          top1: { gloss: 'A', confidence: 0.5, bucket: 'HEAD', is_other: false },
          topk: [
            { rank: 1, gloss: 'A', confidence: 0.5, bucket: 'HEAD', is_other: false },
            { rank: 2, gloss: 'B', confidence: 0.3, bucket: 'MID', is_other: false },
            { rank: 3, gloss: 'C', confidence: 0.1, bucket: 'OTHER', is_other: true }
          ],
          meta: { model: 'v1' }
        }
      }).as('sampleInfer');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.get('#topk').select('3');
      cy.contains('button', 'Inferir Seña').click();
      cy.wait('@sampleInfer');

      // Verificar lista top-k
      cy.get('.topk-list .topk-item').should('have.length', 3);
      cy.get('.topk-item').eq(0).should('contain.text', '#1').and('contain.text', 'A');
      cy.get('.topk-item').eq(1).should('contain.text', '#2').and('contain.text', 'B');
      cy.get('.topk-item').eq(2).should('contain.text', '#3').and('contain.text', 'C');
    });

    it('debe mostrar badge OTHER para predicciones marcadas como is_other', () => {
      cy.intercept('POST', '**/infer?topk=*', {
        statusCode: 200,
        body: {
          top1: { gloss: 'UNKNOWN', confidence: 0.4, bucket: 'OTHER', is_other: true, new_class_id: 999 },
          topk: [{ rank: 1, gloss: 'UNKNOWN', confidence: 0.4, bucket: 'OTHER', is_other: true }],
          meta: { model: 'v1' }
        }
      }).as('sampleInfer');

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );
      cy.contains('button', 'Inferir Seña').click();
      cy.wait('@sampleInfer');

      // Verificar badge OTHER
      cy.get('.other-badge').should('be.visible').and('contain.text', 'OTHER');
    });
  });
});
