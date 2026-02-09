/**
 * Test 01: Carga Inicial de la SPA
 * 
 * OBJETIVO:
 * Verificar que la aplicación React SPA carga correctamente sin errores,
 * mostrando el header, logo, título y los 4 botones de navegación por modo.
 * 
 * SUPOSICIONES:
 * - El título principal es "COMSIGNS"
 * - Subtítulo: "Traducción de Lengua de Señas en Tiempo Real"
 * - Hay 4 botones de modo: Traducir Video, Sistema Experto, Inferir Sample, Cámara en Vivo
 * - El modo por defecto es 'video' (Traducir Video activo)
 */

describe('01 - Carga Inicial de la SPA', () => {
  beforeEach(() => {
    // Interceptar health check para verificar conectividad con backend
    cy.intercept('GET', '**/health').as('healthCheck');
    cy.visit('/');
  });

  it('debe mostrar el header con logo y título', () => {
    // Verificar logo emoji
    cy.get('.logo-icon').should('contain', '🤟');
    
    // Verificar título principal
    cy.contains('h1', 'COMSIGNS').should('be.visible');
    
    // Verificar subtítulo
    cy.contains('Traducción de Lengua de Señas en Tiempo Real').should('be.visible');
  });

  it('debe mostrar los 4 botones de navegación por modo', () => {
    // Verificar que existen los 4 botones
    cy.get('.mode-toggle .mode-btn').should('have.length', 4);
    
    // Verificar textos de cada botón
    cy.contains('.mode-btn', 'Traducir Video').should('be.visible');
    cy.contains('.mode-btn', 'Sistema Experto').should('be.visible');
    cy.contains('.mode-btn', 'Inferir Sample').should('be.visible');
    cy.contains('.mode-btn', 'Cámara en Vivo').should('be.visible');
  });

  it('debe tener el modo "video" activo por defecto', () => {
    // El botón de Traducir Video debe tener la clase 'active'
    cy.contains('.mode-btn', 'Traducir Video')
      .should('have.class', 'active');
    
    // Verificar que el contenido de VideoTranslator está visible
    cy.contains('h2', '🔮 Traducir Videos').should('be.visible');
    cy.contains('Sube uno o varios videos de señas para traducir').should('be.visible');
  });

  it('debe mostrar la zona de drop para videos', () => {
    // Verificar que existe el drop zone
    cy.get('.video-translator .drop-zone').should('be.visible');
    
    // Verificar texto del drop zone
    cy.contains('Arrastra videos aquí').should('be.visible');
    cy.contains('o haz clic para seleccionar').should('be.visible');
  });

  it('debe mostrar el footer con información de versión', () => {
    cy.get('.app-footer').should('be.visible');
    cy.contains('COMSIGNS v0.3.0').should('be.visible');
    cy.contains('Powered by MediaPipe + PyTorch').should('be.visible');
  });

  it('no debe mostrar errores en la consola al cargar', () => {
    // Verificar que no hay elementos de error visibles
    cy.get('.error-toast').should('not.exist');
    cy.get('.error-message').should('not.exist');
  });
});
