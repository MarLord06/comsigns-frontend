/**
 * Test 07: Validación de Archivos Inválidos
 * 
 * OBJETIVO:
 * Verificar que la aplicación valida correctamente los archivos antes de enviarlos:
 * - Tipo de archivo incorrecto
 * - Tamaño excedido
 * - Extensión no permitida
 * 
 * SUPOSICIONES:
 * - VideoTranslator valida: extensión, MIME type, tamaño (max 100MB)
 * - SampleUploader valida: solo .pkl
 * - ExpertPanel valida: solo .pkl
 */

describe('07 - Validación de Archivos Inválidos', () => {
  
  describe('VideoTranslator - Validación de Videos', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn.active', 'Traducir Video').should('exist');
    });

    it('debe rechazar archivo de texto (.txt)', () => {
      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/invalid-file.txt',
        { force: true }
      );

      // El archivo debe aparecer con error
      cy.get('.file-item.has-error').should('exist');
      cy.get('.file-error').should('be.visible');
      cy.contains('Tipo de archivo no soportado').should('be.visible');
    });

    it('debe rechazar archivo de imagen (.png)', () => {
      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/invalid-image.png',
        { force: true }
      );

      cy.get('.file-item.has-error').should('exist');
      cy.get('.file-error').should('be.visible');
    });

    it('debe mostrar error count en el header de la lista', () => {
      cy.get('.video-translator input[type="file"]').selectFile(
        [
          'cypress/fixtures/sample-video.mp4',
          'cypress/fixtures/invalid-file.txt'
        ],
        { force: true }
      );

      // Debe mostrar 2 archivos pero 1 con error
      cy.get('.file-item').should('have.length', 2);
      cy.contains('(1 con error)').should('be.visible');
    });

    it('debe deshabilitar envío si todos los archivos son inválidos', () => {
      cy.get('.video-translator input[type="file"]').selectFile(
        'cypress/fixtures/invalid-file.txt',
        { force: true }
      );

      // El botón debe estar deshabilitado
      cy.get('.translate-btn').should('be.disabled');
    });

    it('debe permitir enviar solo los archivos válidos', () => {
      cy.intercept('POST', '**/api/video/infer*').as('videoInfer');

      cy.get('.video-translator input[type="file"]').selectFile(
        [
          'cypress/fixtures/sample-video.mp4',
          'cypress/fixtures/invalid-file.txt'
        ],
        { force: true }
      );

      // Debe mostrar "Traducir 1 video" (solo el válido)
      cy.get('.translate-btn').should('contain.text', 'Traducir 1 video');
      cy.get('.translate-btn').should('not.be.disabled');
    });
  });

  describe('SampleUploader - Validación de .pkl', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Inferir Sample').click();
      cy.get('.sample-uploader').should('be.visible');
    });

    it('debe rechazar archivo que no sea .pkl', () => {
      // Stub del alert
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('alertStub');
      });

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-video.mp4',
        { force: true }
      );

      // Verificar que se muestra alerta
      cy.get('@alertStub').should('have.been.calledWith', 'Por favor selecciona un archivo .pkl válido');
    });

    it('no debe mostrar botones si el archivo es rechazado', () => {
      cy.window().then((win) => {
        cy.stub(win, 'alert');
      });

      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/invalid-file.txt',
        { force: true }
      );

      // Los botones de acción no deben aparecer
      cy.get('.upload-actions').should('not.exist');
      cy.get('.topk-selector').should('not.exist');
    });

    it('debe aceptar archivo .pkl válido', () => {
      cy.get('.sample-uploader input[type="file"]').selectFile(
        'cypress/fixtures/sample-features.pkl',
        { force: true }
      );

      // Verificar que se muestra el archivo
      cy.contains('sample-features.pkl').should('be.visible');
      cy.get('.upload-actions').should('be.visible');
    });
  });

  describe('ExpertPanel - Validación de .pkl', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('.mode-btn', 'Sistema Experto').click();
      cy.get('.expert-panel').should('be.visible');
    });

    it('debe ignorar archivos que no sean .pkl', () => {
      cy.get('.expert-panel input[type="file"]').selectFile(
        [
          'cypress/fixtures/sample-features.pkl',
          'cypress/fixtures/invalid-file.txt',
          'cypress/fixtures/sample-video.mp4'
        ],
        { force: true }
      );

      // Solo debe mostrar el .pkl válido
      cy.get('.file-item').should('have.length', 1);
      cy.contains('sample-features.pkl').should('be.visible');
    });

    it('debe mostrar error si se filtran archivos', () => {
      cy.get('.expert-panel input[type="file"]').selectFile(
        [
          'cypress/fixtures/sample-features.pkl',
          'cypress/fixtures/invalid-file.txt'
        ],
        { force: true }
      );

      // Debe mostrar mensaje de archivos ignorados
      cy.get('.error-message').should('be.visible');
      cy.contains('archivo(s) ignorados').should('be.visible');
    });

    it('debe mostrar error si no hay archivos .pkl válidos', () => {
      cy.get('.expert-panel input[type="file"]').selectFile(
        'cypress/fixtures/invalid-file.txt',
        { force: true }
      );

      cy.get('.error-message').should('be.visible');
      cy.contains('Por favor selecciona archivos .pkl válidos').should('be.visible');
    });
  });
});
